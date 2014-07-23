package net.nationstatesplusplus.assembly;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.Iterator;
import java.util.LinkedHashSet;

import net.nationstatesplusplus.assembly.util.DatabaseAccess;
import net.nationstatesplusplus.assembly.util.Utils;

import org.joda.time.Duration;

import play.Logger;

import com.limewoodMedia.nsapi.NationStates;
import com.limewoodMedia.nsapi.exceptions.RateLimitReachedException;
import com.limewoodMedia.nsapi.exceptions.UnknownRegionException;
import com.limewoodMedia.nsapi.holders.RegionData;

public class FlagUpdateTask implements Runnable {
	private final NationStates api;
	private final DatabaseAccess access;
	private long lastRun = 0;
	private LinkedHashSet<Integer> regionsToUpdate = new LinkedHashSet<Integer>();
	private LinkedHashSet<Integer> nationsToUpdate = new LinkedHashSet<Integer>();
	public FlagUpdateTask(NationStates api, DatabaseAccess access) {
		this.api = api;
		this.access = access;
	}

	@Override
	public void run() {
		if (lastRun + Duration.standardSeconds(30).getMillis() > System.currentTimeMillis()) {
			Logger.info("[FLAG UPDATE] Skipping flag update run, too soon.");
			return;
		}
		lastRun = System.currentTimeMillis();
		try (Connection conn = access.getPool().getConnection()) {
			final long time = System.currentTimeMillis() - Duration.standardMinutes(2).getMillis();

			try (PreparedStatement select = conn.prepareStatement("SELECT r.region FROM (assembly.global_happenings AS g LEFT JOIN assembly.regional_happenings AS r ON g.id = r.global_id) WHERE g.type = 41 AND g.timestamp > ? GROUP by g.nation ORDER BY g.timestamp ASC")) {
				select.setLong(1, time);
				try (ResultSet result = select.executeQuery()) {
					while(result.next()) {
						regionsToUpdate.add(result.getInt(1));
					}
				}
			}
			
			try (PreparedStatement select = conn.prepareStatement("SELECT id FROM assembly.region WHERE alive = 1 AND population = 0 LIMIT 0, 100")) {
				try (ResultSet result = select.executeQuery()) {
					while(result.next()) {
						regionsToUpdate.add(result.getInt(1));
					}
				}
			}
			
			try (PreparedStatement select = conn.prepareStatement("SELECT nation FROM assembly.global_happenings WHERE type = 7 AND timestamp > ? ORDER BY timestamp ASC")) {
				select.setLong(1, time);
				try (ResultSet result = select.executeQuery()) {
					while(result.next()) {
						nationsToUpdate.add(result.getInt(1));
					}
				}
			}
			
			Logger.debug("[FLAG UPDATE]" + regionsToUpdate.size() + " Region Flag Updates Pending");
			
			Iterator<Integer> iter = regionsToUpdate.iterator();
			for (int i = 0; i < 2 && iter.hasNext(); i++) {
				final int region = iter.next();
				try (PreparedStatement select = conn.prepareStatement("SELECT name FROM assembly.region WHERE id = ?")) {
					select.setInt(1, region);
					try (ResultSet result = select.executeQuery()) {
						if (result.next()) {
							String name = result.getString(1);
							try {
								RegionData data = api.getRegionInfo(name, RegionData.Shards.FLAG, RegionData.Shards.NUM_NATIONS, RegionData.Shards.DELEGATE, RegionData.Shards.FOUNDER);
								String flag = data.flagURL != null ? data.flagURL : "";
								if (flag.startsWith("http://")) {
									flag = "//" + flag.substring(7);
								}
								try (PreparedStatement updateFlag = conn.prepareStatement("UPDATE assembly.region SET flag = ?, population = ?, delegate = ?, founder = ? WHERE id = ?")) {
									updateFlag.setString(1, flag);
									updateFlag.setInt(2, data.numNations);
									updateFlag.setString(3, data.delegate);
									updateFlag.setString(4, data.founder);
									updateFlag.setInt(5, region);
									updateFlag.executeUpdate();
								}
								Logger.info("[FLAG UPDATE] Updated region [" + name + "].");
							} catch (UnknownRegionException e) {
								Logger.warn("[FLAG UPDATE] Unknown region: " + name + ", marking it as dead");
								access.markRegionDead(name, conn);
							}
						}
					}
				}
				iter.remove();
			}
			
			Logger.debug("[FLAG UPDATE]" + nationsToUpdate.size() + " Nation Flag Updates Pending");
			
			iter = nationsToUpdate.iterator();
			for (int i = 0; i < 2 && iter.hasNext(); i++) {
				final int nation = iter.next();
				try (PreparedStatement select = conn.prepareStatement("SELECT name FROM assembly.nation WHERE id = ?")) {
					select.setInt(1, nation);
					try (ResultSet result = select.executeQuery()) {
						if (result.next()) {
							String name = result.getString(1);
							Utils.updateNation(conn, access, api, name, nation);
						}
					}
				}
				iter.remove();
			}
		} catch (RateLimitReachedException e) {
			Logger.warn("[FLAG UPDATE] Flag update task rate limited!");
		} catch (Exception e) {
			Logger.error("[FLAG UPDATE] Unable to execute flag update task", e);
		}
	}
}
