package com.afforess.assembly.util;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.apache.commons.dbutils.DbUtils;

import play.Logger;

import com.mchange.v2.c3p0.ComboPooledDataSource;

public class RegionCache {
	private final Map<String, String> flagCache = new ConcurrentHashMap<String, String>();
	private final ComboPooledDataSource pool;
	public RegionCache(ComboPooledDataSource pool) {
		this.pool = pool;
	}

	public String getRegionFlag(String region) {
		if (region == null) {
			return "http://www.nationstates.net/images/flags/Defaultt2.png";
		}
		region = region.toLowerCase().replaceAll(" ", "_");
		if (flagCache.containsKey(region)) {
			return flagCache.get(region);
		}
		Connection conn = null;
		try {
			conn = pool.getConnection();
			PreparedStatement statement = conn.prepareStatement("SELECT flag FROM assembly.region WHERE name = ?");
			statement.setString(1, region);
			ResultSet result = statement.executeQuery();
			if (result.next()) {
				String flag = result.getString(1);
				flagCache.put(region, flag);
				return flag;
			}
		} catch (SQLException e) {
			Logger.error("Unable to look up region flag", e);
		} finally {
			DbUtils.closeQuietly(conn);
		}
		return "http://www.nationstates.net/images/flags/Defaultt2.png";
	}
}
