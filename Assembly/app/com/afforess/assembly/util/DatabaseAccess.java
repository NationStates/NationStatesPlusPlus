package com.afforess.assembly.util;

import java.security.SecureRandom;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;

import org.apache.commons.dbutils.DbUtils;
import org.joda.time.Duration;

import play.Logger;

import com.afforess.assembly.model.websocket.WebsocketManager;
import com.afforess.assembly.nation.MongoSettings;
import com.afforess.assembly.nation.NationSettings;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.cache.CacheBuilder;
import com.google.common.cache.CacheLoader;
import com.google.common.cache.LoadingCache;
import com.mchange.v2.c3p0.ComboPooledDataSource;
import com.mongodb.BasicDBObject;
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.MongoClient;

public class DatabaseAccess {
	private final ComboPooledDataSource pool;
	private final LoadingCache<String, Integer> regionIdCache;
	private final LoadingCache<String, Integer> nationIdCache;
	private final LoadingCache<Integer, String> reverseIdCache;
	private final LoadingCache<String, String> nationTitleCache;
	@Deprecated
	private final LoadingCache<Integer, String> nationSettings;
	private final WebsocketManager websocketManager;
	private final MongoClient mongo;
	private final int cacheSize;

	public DatabaseAccess(final ComboPooledDataSource pool, MongoClient client, int cacheSize, WebsocketManager wm, boolean backgroundTasks) {
		this.cacheSize = cacheSize;
		this.pool = pool;
		this.mongo = client;
		this.websocketManager = wm;
		Logger.info("Creating Database Cache. Max Size: " + cacheSize);
		this.regionIdCache = CacheBuilder.newBuilder()
			.maximumSize(cacheSize)
			.expireAfterAccess(10, TimeUnit.MINUTES)
			.expireAfterWrite(1, TimeUnit.HOURS)
			.build(new CacheLoader<String, Integer>() {
			public Integer load(String key) throws SQLException {
				Connection conn = null;
				try {
					conn = pool.getConnection();
					PreparedStatement statement = conn.prepareStatement("SELECT id FROM assembly.region WHERE name = ?");
					statement.setString(1, key);
					ResultSet result = statement.executeQuery();
					if (result.next()) {
						return result.getInt(1);
					}
				} catch (SQLException e) {
					Logger.error("Unable to look up region", e);
				} finally {
					DbUtils.closeQuietly(conn);
				}
				return -1;
			}
		});

		this.nationIdCache = CacheBuilder.newBuilder()
			.maximumSize(cacheSize * 5)
			.expireAfterAccess(10, TimeUnit.MINUTES)
			.expireAfterWrite(1, TimeUnit.HOURS)
			.build(new CacheLoader<String, Integer>() {
			public Integer load(String key) throws SQLException {
				Connection conn = null;
				try {
					conn = pool.getConnection();
					PreparedStatement statement = conn.prepareStatement("SELECT id from assembly.nation WHERE name = ?");
					statement.setString(1, key);
					ResultSet result = statement.executeQuery();
					if (result.next()) {
						return result.getInt(1);
					}
				} catch (SQLException e) {
					Logger.error("Unable to look up nation id", e);
				} finally {
					DbUtils.closeQuietly(conn);
				}
				return -1;
			}
		});

		this.reverseIdCache = CacheBuilder.newBuilder()
			.maximumSize(cacheSize)
			.expireAfterAccess(10, TimeUnit.MINUTES)
			.expireAfterWrite(1, TimeUnit.HOURS)
			.build(new CacheLoader<Integer, String>() {
			public String load(Integer key) throws SQLException {
				Connection conn = null;
				try {
					conn = pool.getConnection();
					PreparedStatement statement = conn.prepareStatement("SELECT name from assembly.nation WHERE id = ?");
					statement.setInt(1, key);
					ResultSet result = statement.executeQuery();
					if (result.next()) {
						return result.getString(1);
					}
				} catch (SQLException e) {
					Logger.error("Unable to look up nation id", e);
				} finally {
					DbUtils.closeQuietly(conn);
				}
				throw new RuntimeException("No nation with id [" + key + "] found!");
			}
		});
		
		this.nationTitleCache = CacheBuilder.newBuilder()
				.maximumSize(cacheSize)
				.expireAfterAccess(10, TimeUnit.MINUTES)
				.expireAfterWrite(1, TimeUnit.HOURS)
				.build(new CacheLoader<String, String>() {
				public String load(String key) throws SQLException {
					Connection conn = null;
					try {
						conn = pool.getConnection();
						PreparedStatement statement = conn.prepareStatement("SELECT title from assembly.nation WHERE name = ?");
						statement.setString(1, key);
						ResultSet result = statement.executeQuery();
						if (result.next()) {
							return result.getString(1);
						}
					} catch (SQLException e) {
						Logger.error("Unable to look up nation title", e);
					} finally {
						DbUtils.closeQuietly(conn);
					}
					throw new RuntimeException("No nation with name [" + key + "] found!");
				}
			});

		this.nationSettings = CacheBuilder.newBuilder()
			.maximumSize(0)
			.expireAfterAccess(10, TimeUnit.MINUTES)
			.expireAfterWrite(1, TimeUnit.HOURS)
			.build(new CacheLoader<Integer, String>() {
			public String load(Integer key) throws SQLException {
				Connection conn = null;
				PreparedStatement select = null;
				ResultSet set = null;
				try {
					conn = pool.getConnection();
					select = conn.prepareStatement("SELECT settings FROM assembly.ns_settings WHERE id = ?");
					select.setInt(1, key);
					set = select.executeQuery();
					if (set.next()) {
						String json = set.getString(1);
						if (!set.wasNull()) {
							return json;
						}
					}
				} catch (SQLException e) {
					Logger.error("Unable to look up nation settings", e);
				} finally {
					DbUtils.closeQuietly(set);
					DbUtils.closeQuietly(select);
					DbUtils.closeQuietly(conn);
				}
				return "";
			}
		});
	}

	public MongoClient getMongoClient() {
		return mongo;
	}

	public DB getMongoDB() {
		return mongo.getDB("nspp");
	}

	public final int getMaxCacheSize() {
		return cacheSize;
	}

	public LoadingCache<String, Integer> getNationIdCache() {
		return nationIdCache;
	}

	public int getNationId(String name) {
		name = Utils.sanitizeName(name);
		try {
			int id = nationIdCache.get(name);
			if (id == -1) {
				nationIdCache.invalidate(name);
			}
			return id;
		} catch (ExecutionException e) {
			throw new RuntimeException(e);
		}
	}

	public LoadingCache<String, Integer> getRegionIdCache() {
		return regionIdCache;
	}

	public int getRegionId(String name)  {
		name = Utils.sanitizeName(name);
		try {
			int id = regionIdCache.get(name);
			if (id == -1) {
				regionIdCache.invalidate(name);
			}
			return id;
		} catch (ExecutionException e) {
			throw new RuntimeException(e);
		}
	}

	public LoadingCache<Integer, String> getReverseIdCache() {
		return reverseIdCache;
	}

	public LoadingCache<String, String> getNationTitleCache() {
		return nationTitleCache;
	}

	public String getNationTitle(String name) {
		name = Utils.sanitizeName(name);
		try {
			return nationTitleCache.get(name);
		} catch (ExecutionException e) {
			return Utils.formatName(name);
		}
	}

	public LoadingCache<Integer, String> getNationSettingsCache() {
		return nationSettings;
	}

	public NationSettings getNationSettings(String nation) {
		nation = Utils.sanitizeName(nation);
		
		DB nspp = getMongoDB();
		DBCollection collection = nspp.getCollection("user_settings");
		BasicDBObject find = new BasicDBObject("nation", nation);
		DBCursor cursor = collection.find(find, new BasicDBObject("nation", 1));
		if (cursor.hasNext()) {
			return new MongoSettings(collection, nation);
		}
		Logger.info("Migrating user settings for " + nation);
		try {
			String settings = nationSettings.get(getNationId(nation));
			settings = "{\"nation\":\"" + nation + "\", " + settings.substring(1);
			Logger.info("Modified settings for " + nation + ": [" + settings + "]");
			ObjectMapper mapper = new ObjectMapper();
			try {
				Map<String, Object> data = mapper.readValue(settings, new TypeReference<HashMap<String,Object>>() {});
				BasicDBObject obj = new BasicDBObject(data);
				collection.insert(obj);
				find = new BasicDBObject("nation", nation);
				cursor = collection.find(find, new BasicDBObject("nation", 1));
				if (cursor.hasNext()) {
					return new MongoSettings(collection, nation);
				} else {
					Logger.error("Migrated settings for " + nation + " not found!");
				}
			} catch (Exception e) {
				throw new RuntimeException("Unable to parse nation settings", e);
			}
		} catch (ExecutionException e) {
			Logger.error("Unable to read user settings for " + nation, e);
		}
		
		//collection.
		return null;
	}

	public ComboPooledDataSource getPool() {
		return pool;
	}

	public WebsocketManager getWebsocketManager() {
		return websocketManager;
	}

	public boolean isValidAuthToken(int id, String authToken) {
		//Sha256 digest is 64 chars in length
		if (authToken == null || authToken.length() != 64) {
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
		return generateAuthToken(id, false, null);
	}

	public String generateAuthToken(int id, boolean force, String rssHash) {
		Connection conn = null;
		try {
			conn = pool.getConnection();
			if (!force) {
				PreparedStatement statement = conn.prepareStatement("SELECT auth from assembly.nation_auth WHERE nation_id = ? AND time > ?");
				statement.setInt(1, id);
				statement.setLong(2, System.currentTimeMillis());
				ResultSet result = statement.executeQuery();
				if (result.next()) {
					return result.getString(1);
				}
			}

			SecureRandom random = new SecureRandom();
			String auth = Sha.hash256(id + "-" + System.nanoTime() + "-" + random.nextInt(Integer.MAX_VALUE));

			PreparedStatement select = conn.prepareStatement("SELECT nation_id from assembly.nation_auth WHERE nation_id = ?");
			select.setInt(1, id);
			ResultSet result = select.executeQuery();
			if (result.next()) {
				PreparedStatement update = conn.prepareStatement("UPDATE assembly.nation_auth SET auth = ?, time = ?" + (rssHash != null ? " , rss_hash = ?" : "") + " WHERE nation_id = ?");
				update.setString(1, auth);
				update.setLong(2, System.currentTimeMillis() + Duration.standardDays(1).getMillis());
				if (rssHash != null) {
					update.setString(3, rssHash);
					update.setInt(4, id);
				} else {
					update.setInt(3, id);
				}
				update.executeUpdate();
				DbUtils.closeQuietly(update);
			} else {
				PreparedStatement insert = conn.prepareStatement("INSERT INTO assembly.nation_auth (nation_id, auth, time, rss_hash) VALUES (?, ?, ?, ?)");
				insert.setInt(1, id);
				insert.setString(2, auth);
				insert.setLong(3, System.currentTimeMillis() + Duration.standardDays(1).getMillis());
				if (rssHash != null) {
					insert.setString(4, rssHash);
				} else {
					insert.setNull(4, Types.CHAR);
				}
				insert.executeUpdate();
				DbUtils.closeQuietly(insert);
			}
			return auth;
		} catch (SQLException e) {
			throw new RuntimeException(e);
		} finally {
			DbUtils.closeQuietly(conn);
		}
	}

	public void markNationDead(String nation, Connection conn) throws SQLException {
		markNationDead(getNationId(nation), conn);
	}

	public void markNationDead(int nationId, Connection conn) throws SQLException {
		final boolean givenConn = conn != null;
		if (!givenConn) {
			conn = pool.getConnection();
		}
		try {
			PreparedStatement markDead = conn.prepareStatement("UPDATE assembly.nation SET alive = 0, wa_member = 0, cte = ? WHERE id = ?");
			markDead.setLong(1, System.currentTimeMillis() / 1000L);
			markDead.setInt(2, nationId);
			markDead.executeUpdate();
			
			PreparedStatement hasEndorsement = conn.prepareStatement("DELETE FROM assembly.endorsements WHERE endorsed = ? OR endorser = ?");
			hasEndorsement.setInt(1, nationId);
			hasEndorsement.setInt(2, nationId);
			hasEndorsement.execute();
			hasEndorsement.close();
		} finally {
			if (!givenConn) {
				DbUtils.closeQuietly(conn);
			}
		}
	}

	public void markRegionDead(String region, Connection conn) throws SQLException {
		int regionId = getRegionId(region);
		if (regionId > -1 && region != null) {
			
			PreparedStatement disbandNewspapers = conn.prepareStatement("UPDATE assembly.newspapers SET disbanded = 1 WHERE disbanded = 0 AND region = ?");
			disbandNewspapers.setString(1, Utils.sanitizeName(region));
			disbandNewspapers.executeUpdate();
			
			PreparedStatement disbandRecruitmentCampaigns = conn.prepareStatement("UPDATE assembly.recruit_campaign SET retired = ? WHERE retired IS NOT NULL AND region = ?");
			disbandRecruitmentCampaigns.setLong(1, System.currentTimeMillis());
			disbandRecruitmentCampaigns.setInt(2, regionId);
			disbandRecruitmentCampaigns.executeUpdate();
			
			PreparedStatement markDead = conn.prepareStatement("UPDATE assembly.region SET alive = 0, update_order = -1, embassies = NULL, population = 0 WHERE name = ?");
			markDead.setString(1, Utils.sanitizeName(region));
			markDead.executeUpdate();
		}
	}
}
