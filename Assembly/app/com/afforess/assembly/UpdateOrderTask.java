package com.afforess.assembly;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import org.apache.commons.dbutils.DbUtils;

import play.Logger;

import com.afforess.assembly.util.DatabaseAccess;
import com.afforess.assembly.util.Utils;
import com.limewoodMedia.nsapi.NationStates;
import com.limewoodMedia.nsapi.exceptions.UnknownRegionException;
import com.limewoodMedia.nsapi.holders.RegionData;

public class UpdateOrderTask implements Runnable{
	private final NationStates api;
	private final DatabaseAccess access;
	public UpdateOrderTask(NationStates api, DatabaseAccess access) {
		this.api = api;
		this.access = access;
	}

	@Override
	public void run() {
		Connection conn = null;
		try {
			conn = access.getPool().getConnection();
			PreparedStatement select = conn.prepareStatement("SELECT last_update_order_region FROM assembly.settings WHERE id = 1");
			ResultSet result = select.executeQuery();
			result.next();
			int id = result.getInt(1);
			
			select = conn.prepareStatement("SELECT name, id FROM assembly.region WHERE id > ? AND alive = 1 LIMIT 0, 2");
			select.setInt(1, id);
			result = select.executeQuery();
			int lastId = id;
			while(result.next()) {
				RegionData data;
				try {
					data = api.getRegionInfo(result.getString(1), RegionData.Shards.NATIONS);
				} catch (UnknownRegionException e) {
					PreparedStatement setDead = conn.prepareStatement("UPDATE assembly.region SET alive = 0 WHERE id = ?");
					setDead.setInt(1, result.getInt(2));
					setDead.executeUpdate();
					continue;
				}
				PreparedStatement updateBatch = conn.prepareStatement("UPDATE assembly.nation SET update_order = ? WHERE name = ?");
				for (int i = 0; i < data.nations.length; i++) {
					updateBatch.setInt(1, i);
					updateBatch.setString(2, Utils.sanitizeName(data.nations[i]));
					updateBatch.addBatch();
				}
				updateBatch.executeBatch();
				lastId = result.getInt(2);
			}
			PreparedStatement update = conn.prepareStatement("UPDATE assembly.settings SET last_update_order_region = ? WHERE id = 1");
			update.setInt(1, lastId);
			update.executeUpdate();
		} catch (Exception e) {
			Logger.error("Unable to update region update order", e);
		} finally {
			DbUtils.closeQuietly(conn);
		}
	}
}
