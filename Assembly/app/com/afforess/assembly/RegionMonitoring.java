package com.afforess.assembly;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import org.apache.commons.dbutils.DbUtils;

import play.Logger;

import com.limewoodMedia.nsapi.NationStates;
import com.limewoodMedia.nsapi.exceptions.RateLimitReachedException;
import com.limewoodMedia.nsapi.holders.RegionData;
import com.limewoodMedia.nsapi.holders.RegionHappening;
import com.limewoodMedia.nsapi.holders.WorldData;
import com.mchange.v2.c3p0.ComboPooledDataSource;

public class RegionMonitoring implements Runnable {
	private final NationStates api;
	private final ComboPooledDataSource pool;
	public RegionMonitoring(NationStates api, ComboPooledDataSource pool) {
		this.api = api;
		this.pool = pool;
	}

	@Override
	public void run() {
		Connection conn = null;
		try {
			conn = pool.getConnection();
			WorldData.Shards.REGIONS_BY_TAG.clearTags();
			WorldData.Shards.REGIONS_BY_TAG.addTags("gargantuan");
			WorldData wData = api.getWorldInfo(WorldData.Shards.REGIONS_BY_TAG);
			for (String region : wData.regionsByTag) {
				try {
					Thread.sleep(2500);
				} catch (InterruptedException e) {
					return;
				}
				String formatted = region.toLowerCase().replaceAll(" ", "_");
				RegionData data = api.getRegionInfo(formatted, RegionData.Shards.HAPPENINGS);
				final long lastUpdate = getLastUpdate(conn, formatted);
				long curUpdate = 0L;
				PreparedStatement batchInsert = conn.prepareStatement("INSERT INTO assembly.region_happenings (region, happening, timestamp) VALUES (?, ?, ?)");
				for (RegionHappening happening : data.happenings) {
					if (happening.timestamp > lastUpdate) {
						batchInsert.setString(1, formatted);
						batchInsert.setString(2, happening.text);
						batchInsert.setLong(3, happening.timestamp);
						batchInsert.addBatch();
						curUpdate = Math.max(curUpdate, happening.timestamp);
					}
				}
				if (curUpdate != 0L) {
					batchInsert.executeBatch();
					
					PreparedStatement updateTime = conn.prepareStatement("UPDATE assembly.region SET last_happening_run = ? WHERE name = ?");
					updateTime.setLong(1, curUpdate);
					updateTime.setString(2, formatted);
					updateTime.executeUpdate();
					DbUtils.close(updateTime);
				}
				DbUtils.close(batchInsert);
			}
		} catch (SQLException e) {
			Logger.error("Unable to process region happenings", e);
		} catch (RateLimitReachedException e) {
			Logger.error("Rate limit reached for region happenings", e);
		} finally {
			DbUtils.closeQuietly(conn);
		}
	}

	private long getLastUpdate(Connection conn, String region) throws SQLException {
		PreparedStatement selectUpdate = null;
		ResultSet result = null;
		try {
			selectUpdate = conn.prepareStatement("SELECT last_happening_run FROM assembly.region WHERE name = ?");
			selectUpdate.setString(1, region);
			result = selectUpdate.executeQuery();
			if (result.next()) {
				return result.getLong(1);
			}
			return 0L;
		} finally {
			DbUtils.closeQuietly(selectUpdate);
			DbUtils.closeQuietly(result);
		}
	}
}
