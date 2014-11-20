package net.nationstatesplusplus.assembly;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import net.nationstatesplusplus.assembly.util.DatabaseAccess;
import net.nationstatesplusplus.assembly.util.Utils;

import org.joda.time.Duration;

import play.Logger;

import com.limewoodMedia.nsapi.NationStates;
import com.limewoodMedia.nsapi.exceptions.RateLimitReachedException;
import com.limewoodMedia.nsapi.exceptions.UnknownRegionException;
import com.limewoodMedia.nsapi.holders.RegionData;

public class UpdateOrderTask implements Runnable{
	private final NationStates api;
	private final DatabaseAccess access;
	private long lastRun = 0;
	public UpdateOrderTask(NationStates api, DatabaseAccess access) {
		this.api = api;
		this.access = access;
	}

	@Override
	public void run() {
		if (lastRun + Duration.standardSeconds(30).getMillis() > System.currentTimeMillis()) {
			Logger.info("Skipping update order run, too soon.");
			return;
		}
		lastRun = System.currentTimeMillis();
		try (Connection conn = access.getPool().getConnection()) {
			final int id;
			try (PreparedStatement select = conn.prepareStatement("SELECT last_update_order_region FROM assembly.settings WHERE id = 1")) {
				try (ResultSet result = select.executeQuery()) {
					result.next();
					id = result.getInt(1);
				}
			}

			try (PreparedStatement select = conn.prepareStatement("SELECT name, id FROM assembly.region WHERE id > ? AND alive = 1 LIMIT 0, 2")) {
				select.setInt(1, id);

				int lastId = id;
				final int startId = lastId;

				try (ResultSet result = select.executeQuery()) {
					while (result.next()) {
						RegionData data;
						try {
							data = api.getRegionInfo(result.getString(1), RegionData.Shards.NATIONS);
						} catch (UnknownRegionException e) {
							try (PreparedStatement setDead = conn.prepareStatement("UPDATE assembly.region SET alive = 0 WHERE id = ?")) {
								setDead.setInt(1, result.getInt(2));
								setDead.executeUpdate();
							}
							continue;
						}
						try (PreparedStatement updateBatch = conn.prepareStatement("UPDATE assembly.nation SET update_order = ? WHERE name = ?")) {
							for (int i = 0; i < data.nations.length; i++) {
								updateBatch.setInt(1, data.nations.length - i);
								updateBatch.setString(2, Utils.sanitizeName(data.nations[i]));
								updateBatch.addBatch();
							}
							updateBatch.executeBatch();
						}
						lastId = result.getInt(2);
						Logger.debug("Updated update order for region id [" + lastId + "]");
					}
				}
				PreparedStatement update = conn.prepareStatement("UPDATE assembly.settings SET last_update_order_region = ? WHERE id = 1");
				update.setInt(1, (lastId != startId ? lastId : 0));
				update.executeUpdate();
			}
		} catch (RateLimitReachedException e) {
			Logger.warn("Update order task rate limited!");
		} catch (Exception e) {
			Logger.error("Unable to update region update order", e);
		}
	}
}
