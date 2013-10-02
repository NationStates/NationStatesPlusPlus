package com.afforess.assembly;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Matcher;

import org.apache.commons.dbutils.DbUtils;
import org.apache.commons.lang.WordUtils;
import org.joda.time.Duration;

import play.Logger;

import com.afforess.assembly.model.HappeningType;
import com.afforess.assembly.util.DatabaseAccess;
import com.afforess.assembly.util.Utils;
import com.limewoodMedia.nsapi.NationStates;
import com.limewoodMedia.nsapi.exceptions.RateLimitReachedException;
import com.limewoodMedia.nsapi.holders.HappeningData;
import com.limewoodMedia.nsapi.holders.HappeningData.EventHappening;
import com.mchange.v2.c3p0.ComboPooledDataSource;

public class HappeningsTask implements Runnable {
	private final NationStates api;
	private final ComboPooledDataSource pool;
	private final DatabaseAccess access;
	private int maxEventId = -1;
	private int newEvents = 0;
	private long lastRun = 0L;
	/**
	 * A counter, when set > 0, runs happening update polls at 2s intervals, otherwise at 10s intervals.
	 */
	private final AtomicInteger highActivity = new AtomicInteger(0);
	public HappeningsTask(DatabaseAccess access, NationStates api) {
		this.api = api;
		this.pool = access.getPool();
		this.access = access;
	}

	public boolean isHighActivity() {
		return highActivity.get() > 0;
	}

	private long getLastUpdate(Connection conn, String nation) throws SQLException {
		PreparedStatement selectUpdate = null;
		ResultSet result = null;
		try {
			selectUpdate = conn.prepareStatement("SELECT last_happening_run FROM assembly.nation WHERE name = ?");
			selectUpdate.setString(1, nation);
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

	private void setLastUpdate(Connection conn, String nation, long timestamp) throws SQLException{
		PreparedStatement update = null;
		try {
			update = conn.prepareStatement("UPDATE assembly.nation SET last_happening_run = ? WHERE name = ?");
			update.setLong(1, timestamp);
			update.setString(2, nation);
			update.executeUpdate();
		} finally {
			DbUtils.closeQuietly(update);
		}
	}

	private String parseHappening(String text) {
		int index = text.indexOf("%rmb%%");
		if (index > -1) {
			int start = text.indexOf("%% %%");
			text = text.substring(0, start + 3) + "##" + text.substring(start + 5, index) + "##" + text.substring(index + 6);
		}
		
		return text;
	}

	@Override
	public void run() {
		try {
			runImpl();
		} catch (Exception e) {
			Logger.error("Exception processing happenings", e);
			highActivity.incrementAndGet();
		}
	}

	public void runImpl() {
		HappeningData data;
		synchronized (api) {
			//Throttle the happening queries based on how many new happenings occurred last run
			if (lastRun + Duration.standardSeconds(10).getMillis() > System.currentTimeMillis()) {
				final int activity = this.highActivity.get();
				if (newEvents >= 25 || activity > 0) {
					Logger.info("Very high happenings activity, running at 2s intervals");
					this.highActivity.set(newEvents >= 25 ? 10 : activity - 1);
				} else {
					Logger.debug("Skipping happening run, little activity, last run was " + (System.currentTimeMillis() - lastRun) + " ms ago");
					return;
				}
			}
			lastRun = System.currentTimeMillis();
			newEvents = 0;
			Logger.info("Starting global happenings run. Max Event ID: " + maxEventId);
			try {
				data = api.getHappeningInfo(null, -1, maxEventId);
			} catch (RateLimitReachedException e) {
				Logger.warn("Happenings monitoring rate limited!");
				return;
			}
			final int oldEventId = maxEventId;
			for (EventHappening happening : data.happenings) {
				if (maxEventId < happening.eventId) {
					maxEventId = happening.eventId;
				}
				if (oldEventId < happening.eventId) {
					newEvents++;
				}
			}
		}
		Connection conn = null;
		try {
			conn = pool.getConnection();
			PreparedStatement batchInsert = conn.prepareStatement("INSERT INTO assembly.global_happenings (nation, happening, timestamp, type) VALUES (?, ?, ?, ?)");
			for (EventHappening happening : data.happenings) {
				final String text = happening.text;
				final long timestamp = happening.timestamp * 1000;
				Matcher match = Utils.NATION_PATTERN.matcher(text);
				int nationId = -1;
				boolean valid = true;
				if (match.find()) {
					String title = text.substring(match.start() + 2, match.end() - 2);
					String nation = Utils.sanitizeName(title);
					final long lastUpdate = getLastUpdate(conn, nation);
					valid = false;
					if (timestamp > lastUpdate) {
						nationId = access.getNationIdCache().get(nation);
						valid = true;
						if (nationId == -1) {
							PreparedStatement insert = conn.prepareStatement("INSERT INTO assembly.nation (name, title, full_name, region, first_seen) VALUES (?, ?, ?, ?, ?)", Statement.RETURN_GENERATED_KEYS);
							insert.setString(1, nation);
							insert.setString(2, title);
							insert.setString(3, WordUtils.capitalizeFully(nation.replaceAll("_", " ")));
							insert.setInt(4, -1);
							insert.setLong(5, happening.timestamp);
							insert.executeUpdate();
							ResultSet keys = insert.getGeneratedKeys();
							keys.next();
							nationId = keys.getInt(1);
							access.getNationIdCache().put(nation, nationId);
						}
						
						setLastUpdate(conn, nation, timestamp);
					}
				}
				if (valid) {
					final int happeningType = HappeningType.match(text);

					if (happeningType == HappeningType.getType("ENDORSEMENT").getId()) {
						if (match.find(match.end())) {
							String title = text.substring(match.start() + 2, match.end() - 2);
							String nation = Utils.sanitizeName(title);
							addEndorsement(conn, access.getNationIdCache().get(nation), nationId);
						}
					} else if (happeningType == HappeningType.getType("WITHDREW_ENDORSEMENT").getId()) {
						if (match.find(match.end())) {
							String title = text.substring(match.start() + 2, match.end() - 2);
							String nation = Utils.sanitizeName(title);
							removeEndorsement(conn, access.getNationIdCache().get(nation), nationId);
						}
					} else if (happeningType == HappeningType.getType("LOST_ENDORSEMENT").getId()) {
						if (match.find(match.end())) {
							String title = text.substring(match.start() + 2, match.end() - 2);
							String nation = Utils.sanitizeName(title);
							removeEndorsement(conn, nationId, access.getNationIdCache().get(nation));
						}
					} else if (happeningType == HappeningType.getType("RESIGNED_FROM_WORLD_ASSEMBLY").getId()) {
						resignFromWorldAssembly(conn, nationId, false);
					} else if (happeningType == HappeningType.getType("ADMITTED_TO_WORLD_ASSEMBLY").getId()) {
						joinWorldAssembly(conn, nationId);
					} else if (happeningType == HappeningType.getType("EJECTED_FOR_RULE_VIOLATIONS").getId()) {
						resignFromWorldAssembly(conn, nationId, true);
					}

					batchInsert.setInt(1, nationId);
					batchInsert.setString(2, parseHappening(text));
					batchInsert.setLong(3, timestamp);
					batchInsert.setInt(4, happeningType);
					batchInsert.addBatch();
				}
			}
			batchInsert.executeBatch();
		} catch (SQLException e) {
			Logger.error("Unable to update happenings", e);
		}  catch (ExecutionException e) {
			Logger.error("Unable to update happenings", e);
		} finally {
			DbUtils.closeQuietly(conn);
		}
	}

	private void addEndorsement(Connection conn, int endorsed, int endorser) throws SQLException {
		PreparedStatement selectDuplicates = conn.prepareStatement("SELECT endorsed FROM assembly.endorsements WHERE endorsed = ? AND endorser = ?");
		selectDuplicates.setInt(1, endorsed);
		selectDuplicates.setInt(2, endorser);
		if (!selectDuplicates.executeQuery().next()) {
			PreparedStatement endorsements = conn.prepareStatement("INSERT INTO assembly.endorsements (endorser, endorsed) VALUES (?, ?)");
			endorsements.setInt(1, endorser);
			endorsements.setInt(2, endorsed);
			endorsements.executeUpdate();
			DbUtils.closeQuietly(endorsements);
		}
		DbUtils.closeQuietly(selectDuplicates);
	}

	private void removeEndorsement(Connection conn, int endorsed, int endorser) throws SQLException {
		PreparedStatement endorsements = conn.prepareStatement("DELETE FROM assembly.endorsements WHERE endorsed = ? AND endorser = ?");
		endorsements.setInt(1, endorsed);
		endorsements.setInt(2, endorser);
		endorsements.executeUpdate();
		DbUtils.closeQuietly(endorsements);
	}

	private void resignFromWorldAssembly(Connection conn, int nationId, boolean banned) throws SQLException {
		PreparedStatement endorsements = conn.prepareStatement("UPDATE assembly.nation SET wa_member = " + (banned ? "0" : "2") + " WHERE id = ?");
		endorsements.setInt(1, nationId);
		endorsements.executeUpdate();
		DbUtils.closeQuietly(endorsements);
	}

	private void joinWorldAssembly(Connection conn, int nationId) throws SQLException {
		PreparedStatement endorsements = conn.prepareStatement("UPDATE assembly.nation SET wa_member = 1 WHERE id = ?");
		endorsements.setInt(1, nationId);
		endorsements.executeUpdate();
		DbUtils.closeQuietly(endorsements);
	}
}
