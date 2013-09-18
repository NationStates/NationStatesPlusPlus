package com.afforess.assembly.util;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.apache.commons.dbutils.DbUtils;
import org.joda.time.Duration;

import play.Logger;

import com.mchange.v2.c3p0.ComboPooledDataSource;

public class NationCache {
	private final Map<String, Integer> nationCache = new ConcurrentHashMap<String, Integer>();
	private final Map<Integer, String> idCache = new ConcurrentHashMap<Integer, String>();
	private final Map<Integer, String> flagCache = new ConcurrentHashMap<Integer, String>();
	private final Map<Integer, Boolean> waMemberCache = new ConcurrentHashMap<Integer, Boolean>();
	private final ComboPooledDataSource pool;
	public NationCache(ComboPooledDataSource pool) {
		this.pool = pool;
	}

	public void updateCache(String nation, String flag, Boolean waStatus, int id) {
		nationCache.put(nation, id);
		if (id > -1) {
			idCache.put(id, nation);
		}
		if (flag != null) {
			flagCache.put(id, flag);
		}
		if (waStatus != null) {
			waMemberCache.put(id, waStatus);
		}
	}

	public String getNationFlag(int nationId) {
		String cache = flagCache.get(nationId);
		if (cache != null) {
			return cache;
		}
		//Force the cache to be updated
		if (getNationName(nationId) != null) {
			return flagCache.get(nationId);
		}
		return "http://www.nationstates.net/images/flags/Defaultt2.png";
	}

	public boolean isWAMember(int nationId) {
		Boolean cache = waMemberCache.get(nationId);
		if (cache != null) {
			return cache;
		}
		//Force the cache to be updated
		if (getNationName(nationId) != null) {
			return waMemberCache.get(nationId);
		}
		return false;
	}

	public int getNationId(String nation) {
		if (nation == null) {
			return -1;
		}
		nation = nation.toLowerCase().replaceAll(" ", "_");
		Integer cache = nationCache.get(nation);
		if (cache != null && cache.intValue() > -1) {
			return cache;
		}
		Connection conn = null;
		try {
			conn = pool.getConnection();
			PreparedStatement statement = conn.prepareStatement("SELECT id, flag, wa_member from assembly.nation WHERE name = ?");
			statement.setString(1, nation);
			ResultSet result = statement.executeQuery();
			if (result.next()) {
				int id = result.getInt(1);
				String flag = result.getString(2);
				boolean waMember = result.getByte(3) == 1;
				nationCache.put(nation, id);
				idCache.put(id, nation);
				flagCache.put(id, flag);
				waMemberCache.put(id, waMember);
				return id;
			}
		} catch (SQLException e) {
			Logger.error("Unable to look up nation id", e);
		} finally {
			DbUtils.closeQuietly(conn);
		}
		return -1;
	}
	
	public boolean isValidAuthToken(int id, String authToken) {
		if (authToken == null) {
			return false;
		}
		Connection conn = null;
		try {
			conn = pool.getConnection();
			PreparedStatement statement = conn.prepareStatement("SELECT auth from assembly.nation_auth WHERE nation_id = ? AND time > ?");
			statement.setInt(1, id);
			statement.setLong(2, System.currentTimeMillis());
			ResultSet result = statement.executeQuery();
			while (result.next()) {
				if (authToken.equals(result.getString(1))) {
					return true;
				}
			}
		} catch (SQLException e) {
			Logger.error("Unable to verify auth token", e);
		} finally {
			DbUtils.closeQuietly(conn);
		}
		return false;
	}

	public String generateAuthToken(int id) {
		Connection conn = null;
		try {
			conn = pool.getConnection();
			PreparedStatement statement = conn.prepareStatement("SELECT auth from assembly.nation_auth WHERE nation_id = ? AND time > ?");
			statement.setInt(1, id);
			statement.setLong(2, System.currentTimeMillis());
			ResultSet result = statement.executeQuery();
			while (result.next()) {
				return result.getString(1);
			}
			String auth = Sha.hash256(id + "-" + System.nanoTime());
			statement = conn.prepareStatement("INSERT INTO assembly.nation_auth (nation_id, auth, time) VALUES (?, ?, ?)");
			statement.setInt(1, id);
			statement.setString(2, auth);
			statement.setLong(3, System.currentTimeMillis() + Duration.standardDays(7).getMillis());
			statement.executeUpdate();
			return auth;
		} catch (SQLException e) {
			throw new RuntimeException(e);
		} finally {
			DbUtils.closeQuietly(conn);
		}
	}

	public String getNationName(int id) {
		String cache = idCache.get(id);
		if (cache != null) {
			return cache;
		}
		Connection conn = null;
		try {
			conn = pool.getConnection();
			PreparedStatement statement = conn.prepareStatement("SELECT name, flag, wa_member from assembly.nation WHERE id = ?");
			statement.setInt(1, id);
			ResultSet result = statement.executeQuery();
			if (result.next()) {
				String name = result.getString(1);
				String flag = result.getString(2);
				boolean waMember = result.getByte(3) == 1;
				nationCache.put(name, id);
				idCache.put(id, name);
				flagCache.put(id, flag);
				waMemberCache.put(id, waMember);
				return name;
			}
		} catch (SQLException e) {
			Logger.error("Unable to look up nation id", e);
		} finally {
			DbUtils.closeQuietly(conn);
		}
		return null;
	}
}
