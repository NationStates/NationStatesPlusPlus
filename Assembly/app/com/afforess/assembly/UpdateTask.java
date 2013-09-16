package com.afforess.assembly;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Savepoint;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.apache.commons.dbutils.DbUtils;

import play.Logger;

import com.afforess.assembly.util.NationCache;
import com.afforess.assembly.util.Sha;
import com.limewoodMedia.nsapi.NationStates;
import com.limewoodMedia.nsapi.enums.CauseOfDeath;
import com.limewoodMedia.nsapi.enums.WAStatus;
import com.limewoodMedia.nsapi.exceptions.RateLimitReachedException;
import com.limewoodMedia.nsapi.exceptions.UnknownNationException;
import com.limewoodMedia.nsapi.holders.NationData;
import com.limewoodMedia.nsapi.holders.NationHappening;
import com.limewoodMedia.nsapi.holders.RegionData;
import com.limewoodMedia.nsapi.holders.NationData.Shards;
import com.mchange.v2.c3p0.ComboPooledDataSource;

public class UpdateTask implements Runnable{

	private final static Integer[] CENSUS_IDS;
	static {
		CENSUS_IDS = new Integer[69];
		for (int i = 0; i <= 68; i++) {
			CENSUS_IDS[i] = Integer.valueOf(i);
		}
	}

	private final NationStates api;
	private List<String> nations;
	private int index = 0;
	private final Map<String, Long> nationHappeningCache = new HashMap<String, Long>();
	private final ComboPooledDataSource pool;
	private final NationCache cache;
	private final HappeningsTask happenings;
	public UpdateTask(NationStates api, ComboPooledDataSource pool, NationCache cache, HappeningsTask happenings) {
		this.api = api;
		this.pool = pool;
		this.cache = cache;
		this.happenings = happenings;
	}

	@Override
	public void run() {
		Connection conn = null;
		try {
			conn = pool.getConnection();
			if (nations == null) {
				Set<String> allNations = new HashSet<String>();
				String[] nationsList;
				try {
					nationsList = api.getRegionInfo("Capitalist Paradise", RegionData.Shards.NATIONS).nations;
				} catch (RateLimitReachedException e) {
					return;
				}
				if (nationsList == null) {
					return;
				}
				allNations.addAll(Arrays.asList(nationsList));
				
				Logger.info("Adding " + ((allNations.size() / 15) + 2) + " nations needing an update");
				PreparedStatement selectUpdates = conn.prepareStatement("SELECT name FROM assembly.nation WHERE needs_update = 1 LIMIT 0, " + ((allNations.size() / 15) + 2));
				ResultSet result = selectUpdates.executeQuery();
				while(result.next()) {
					allNations.add(result.getString(1));
				}
				DbUtils.closeQuietly(result);
				DbUtils.closeQuietly(selectUpdates);

				nations = new ArrayList<String>(allNations);
				Logger.info("Retrieving nation list, starting new run");
			}
			final int limit = Math.min(index + (happenings.isHighActivity() ? 5 : 20), nations.size());
			for (int i = index; i < limit; i++) {
				final String nation = nations.get(i);
				//Fetch nation data
				Logger.info("Updating happenings and wa status for " + nation);
				
				final boolean needsHistoryUpdate = needsHistoryUpdate(conn, cache.getNationId(nation));
				NationData data = null;
				try {
					data = retrieveNationData(nation, needsHistoryUpdate);
				} catch (RateLimitReachedException e) {
					break;
				}
				if (data != null) {
					final NationStatus status = updateNationStatus(conn, data, nation);
					final int nationId = status.nationId;
					
					PreparedStatement alive = conn.prepareStatement("UPDATE assembly.nation SET alive = 1 WHERE id = ?");
					alive.setInt(1, nationId);
					alive.execute();

					if (status.region.equalsIgnoreCase("Capitalist Paradise")) {
						//Update endorsements
						if (status.waMember) {
							long time = System.nanoTime();
							updateEndorsements(conn, data, nationId);
							Logger.trace("Time to update endorsements took: " + (System.nanoTime() - time) / 1E6D + " ms");
						}

						if (needsHistoryUpdate) {
							long time = System.nanoTime();
							updateHistory(conn, data.endorsements.length, data, nationId);
							Logger.trace("Time to update history: " + (System.nanoTime() - time) / 1E6D + " ms");
						}
					}
					//Parse happenings
					long happenings = System.nanoTime();
					updateNationHappenings(conn, data, nation);
					Logger.trace("Time to update happenings took: " + (System.nanoTime() - happenings) / 1E6D + " ms");
				} else {
					PreparedStatement update = conn.prepareStatement("UPDATE assembly.nation SET alive = 0, needs_update = 0 WHERE name = ?");
					update.setString(1, nation);
					update.execute();
				}
				index++;
			}
			
			if (index == nations.size()) {
				nations = null;
				index = 0;
				PreparedStatement update = conn.prepareStatement("UPDATE assembly.nation SET wa_member = 0, endorsements = 0, influence = 0 WHERE region <> 'Capitalist Paradise'");
				update.execute();
				
				PreparedStatement selectDead = conn.prepareStatement("SELECT id FROM assembly.nation WHERE alive = 0");
				ResultSet result = selectDead.executeQuery();
				
				PreparedStatement hasEndorsement = conn.prepareStatement("DELETE FROM assembly.endorsements WHERE endorsed = ? OR endorser = ?");
				while(result.next()) {
					int id = result.getInt(1);
					hasEndorsement.setInt(1, id);
					hasEndorsement.setInt(2, id);
					hasEndorsement.addBatch();
				}
				hasEndorsement.executeBatch();
				Logger.info("Completed run of all nations");
			}
		} catch (Exception e) {
			e.printStackTrace();
		} finally {
			if (conn != null) {
				try { conn.close(); } catch (SQLException ignore) { }
			}
		}
	}

	private NationStatus updateNationStatus(final Connection conn, final NationData data, final String nation) throws SQLException {
		long updateData = System.nanoTime();

		PreparedStatement statement = conn.prepareStatement("SELECT id, formatted_name, wa_member, endorsements, influence, flag, last_login, influence_desc, region FROM assembly.nation WHERE name = ?");
		statement.setString(1, nation);
		ResultSet result = statement.executeQuery();
		final int nationId;
		final boolean waMember = WAStatus.NON_MEMBER != data.worldAssemblyStatus;
		final int influence = data.censusScore != null && data.censusScore.containsKey(65) ? data.censusScore.get(65).intValue() : 0;
		ArrayList<String> endorsements = new ArrayList<String>(waMember ? 25 : 1);
		if (data.endorsements != null) {
			for (String endorsement : data.endorsements) {
				String formatted = endorsement.trim();
				if (formatted.length() > 0) {
					endorsements.add(formatted);
				}
			}
		}
		data.endorsements = endorsements.toArray(new String[endorsements.size()]);
		
		if (!result.next()) {
			PreparedStatement insert = conn.prepareStatement("INSERT INTO assembly.nation (name, formatted_name, wa_member, endorsements, influence, flag, last_login, influence_desc, region, first_seen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", Statement.RETURN_GENERATED_KEYS);
			insert.setString(1, nation);
			insert.setString(2, data.fullName);
			insert.setByte(3, (byte) (WAStatus.NON_MEMBER == data.worldAssemblyStatus ? 0 : 1));
			insert.setInt(4, data.endorsements.length);
			insert.setInt(5, influence);
			insert.setString(6, data.flagURL);
			insert.setLong(7, data.lastLogin);
			insert.setString(8, data.influence);
			insert.setString(9, data.region);
			insert.setLong(10, System.currentTimeMillis() / 1000L);
			
			insert.executeUpdate();
			ResultSet keys = insert.getGeneratedKeys();
			keys.next();
			nationId = keys.getInt(1);
			insert.close();
		} else {
			nationId = result.getInt(1);
			PreparedStatement update = conn.prepareStatement("UPDATE assembly.nation SET formatted_name = ?, wa_member = ?, endorsements = ?, influence = ?, flag = ?, last_login = ?, influence_desc = ?, region = ?, alive = ?, needs_update = 0 WHERE id = ?");
			update.setString(1, data.fullName);
			update.setByte(2, (byte) (waMember ? 1 : 0));
			update.setInt(3, data.endorsements.length);
			update.setInt(4, influence);
			update.setString(5, data.flagURL);
			update.setLong(6, data.lastLogin);
			update.setString(7, data.influence);
			update.setString(8, data.region);
			update.setByte(9, (byte) 1);
			update.setInt(10, nationId);
			
			update.execute();
			DbUtils.closeQuietly(update);
		}
		statement.close();

		Logger.trace("Time to update nation data took: " + (System.nanoTime() - updateData) / 1E6D + " ms");
		
		//Add to nation id cache
		cache.updateCache(nation, data.flagURL, waMember, nationId);
		
		return new NationStatus(nation, nationId, data.region, waMember);
	}

	private NationData retrieveNationData(final String nation, final boolean history) {
		long fetchData = System.nanoTime();
		NationData data = null;
		try {
			Shards.CENSUS_SCORE.clearIds();
			if (history) {
				Shards.CENSUS_SCORE.addIds(CENSUS_IDS);
				data = api.getNationInfo(nation, Shards.REGION, Shards.HAPPENINGS, Shards.FULL_NAME, Shards.WA_STATUS, Shards.ENDORSEMENTS, Shards.CENSUS_SCORE, Shards.FLAG, Shards.INFLUENCE, Shards.LAST_LOGIN, Shards.DEATHS, Shards.TAX_RATE, Shards.PUBLIC_SECTOR, Shards.FREEDOM_SCORES);
			} else {
				Shards.CENSUS_SCORE.addIds(65);
				data = api.getNationInfo(nation, Shards.REGION, Shards.HAPPENINGS, Shards.FULL_NAME, Shards.WA_STATUS, Shards.ENDORSEMENTS, Shards.CENSUS_SCORE, Shards.FLAG, Shards.INFLUENCE, Shards.LAST_LOGIN);
			}
		} catch (UnknownNationException e) {
			Logger.warn("Nation is unknown " + nation + ".");
		} catch (RateLimitReachedException e) {
			Logger.warn("Unable to read nation info for " + nation + " reached rate limit");
			throw e;
		} catch (Exception e) {
			Logger.warn("Unable to read nation info for " + nation, e);
		} finally {
			Logger.trace("Time to fetch nation data took: " + (System.nanoTime() - fetchData) / 1E6D + " ms");
		}
		return data;
	}

	private boolean needsHistoryUpdate(final Connection conn, final int nationId) throws SQLException {
		if (nationId > -1) {
			PreparedStatement history = conn.prepareStatement("SELECT nation_id FROM nation_history WHERE nation_id = ? AND timestamp > ?");
			history.setInt(1, nationId);
			long prevDay = (System.currentTimeMillis() / 1000L) - 60L * 60L * 12L;
			history.setLong(2, prevDay);
			ResultSet result = history.executeQuery();
			return !result.next();
		}
		return true;
	}

	private void updateHistory(final Connection conn, final int endorsements, final NationData data, final int nationId) throws SQLException {
		StringBuilder sql = new StringBuilder("INSERT INTO nation_history (nation_id, timestamp, endorsements, ");
		int values = 3;
		for (int i = 0; i < CENSUS_IDS.length; i++) {
			sql.append("CENSUS_").append(i).append(", ");
			values++;
		}
		sql.append("civil_rights, economy, political_freedoms, ");
		values += 3;
		for (int i = 0; i < CauseOfDeath.values().length; i++) {
			CauseOfDeath cause = CauseOfDeath.values()[i];
			sql.append(cause.name()).append(", ");
			values++;
		}
		sql.append("tax_rate, public_sector) VALUES (");
		values += 2;
		for (int i = 0; i < values; i++) {
			sql.append("?, ");
		}
		sql.delete(sql.length() - 2, sql.length());
		sql.append(")");
		PreparedStatement insert = conn.prepareStatement(sql.toString());
		
		int index = 1;
		insert.setInt(index, nationId); index++;
		insert.setLong(index, System.currentTimeMillis() / 1000L); index++;
		insert.setInt(index, endorsements); index++;
		for (int i = 0; i < CENSUS_IDS.length; i++) {
			if (data.censusScore != null && data.censusScore.containsKey(i)) {
				insert.setFloat(index, data.censusScore.get(i));
			} else {
				insert.setFloat(index, 0);
			}
			index++;
		}
		insert.setInt(index, data.freedoms.civilRightsValue); index++;
		insert.setInt(index, data.freedoms.economyValue); index++;
		insert.setInt(index, data.freedoms.politicalFreedomsValue); index++;
		for (int i = 0; i < CauseOfDeath.values().length; i++) {
			CauseOfDeath cause = CauseOfDeath.values()[i];
			if (data.deaths != null && data.deaths.containsKey(cause)) {
				insert.setInt(index, data.deaths.get(cause));
			} else {
				insert.setInt(index, 0);
			}
			index++;
		}
		insert.setInt(index, data.taxRate); index++;
		insert.setInt(index, data.publicSector); index++;
		insert.execute();
		insert.close();
	}

	private void updateEndorsements(final Connection conn, final NationData data, final int nationId) throws SQLException {
		conn.setAutoCommit(false);
		Savepoint save =  conn.setSavepoint();
		try {
			PreparedStatement endorsements = conn.prepareStatement("INSERT INTO assembly.endorsements (endorser, endorsed) VALUES (?, ?)");
			for (String endorsed : data.endorsements) {
				if (endorsed.trim().length() > 0) {
					endorsements.setInt(1, cache.getNationId(endorsed));
					endorsements.setInt(2, nationId);
					endorsements.addBatch();
				}
			}

			PreparedStatement hasEndorsement = conn.prepareStatement("DELETE FROM assembly.endorsements WHERE endorsed = ?");
			hasEndorsement.setInt(1, nationId);
			hasEndorsement.execute();
			hasEndorsement.close();
			
			endorsements.executeBatch();
			endorsements.close();
			
			conn.commit();
			conn.releaseSavepoint(save);
		} catch (SQLException e) {
			conn.rollback(save);
			Logger.error("Rolling back endorsement transaction");
			throw e;
		} finally {
			conn.setAutoCommit(true);
		}
	}

	private void updateNationHappenings(final Connection conn, final NationData data, final String nation) throws SQLException {
		final PreparedStatement select = conn.prepareStatement("SELECT nation FROM assembly.nation_happenings WHERE happening_sha_256 = ?");
		final PreparedStatement insert = conn.prepareStatement("INSERT INTO assembly.nation_happenings (nation, happening, timestamp, happening_sha_256) VALUES (?, ?, ?, ?)");
		//Grab most recent happening from cache
		final long lastTime;
		if (nationHappeningCache.containsKey(nation)) {
			lastTime = nationHappeningCache.get(nation);
		} else {
			lastTime = 0;
		}
		//Keep track of the most recent happening
		long newestHappening = lastTime;
		for (NationHappening happening : data.happenings) {
			//Skip if older than most recent in cache (already in db)
			if (happening.timestamp >= lastTime) { 
				String sha256 = Sha.hash256(happening.text + happening.timestamp);
				select.setString(1, sha256);
				ResultSet result = select.executeQuery();
				if (!result.next()) {
					insert.setString(1, nation);
					insert.setString(2, happening.text);
					insert.setLong(3, happening.timestamp);
					insert.setString(4, sha256);
					insert.execute();
				}
				//If this happening is more recent, use it
				if (happening.timestamp > newestHappening) {
					newestHappening = happening.timestamp;
				}
			}
		}
		//Cache most recent happening
		nationHappeningCache.put(nation, newestHappening);

		select.close();
		insert.close();
	}

	private static class NationStatus {
		private final boolean waMember;
		private final String region;
		private final int nationId;
		@SuppressWarnings("unused")
		private final String nation;
		public NationStatus(String nation, int id, String region, boolean wa) {
			this.nation = nation;
			this.nationId = id;
			this.region = region;
			this.waMember = wa;
		}
	}
}
