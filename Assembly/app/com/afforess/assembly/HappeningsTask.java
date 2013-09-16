package com.afforess.assembly;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.regex.Matcher;

import org.apache.commons.dbutils.DbUtils;
import org.apache.commons.lang.WordUtils;
import org.joda.time.Duration;

import play.Logger;

import com.afforess.assembly.util.NationCache;
import com.afforess.assembly.util.Utils;
import com.limewoodMedia.nsapi.NationStates;
import com.limewoodMedia.nsapi.exceptions.RateLimitReachedException;
import com.limewoodMedia.nsapi.holders.HappeningData;
import com.limewoodMedia.nsapi.holders.HappeningData.EventHappening;
import com.mchange.v2.c3p0.ComboPooledDataSource;

public class HappeningsTask implements Runnable {
	private final NationStates api;
	private final ComboPooledDataSource pool;
	private final NationCache cache;
	private int maxEventId = -1;
	private int newEvents = 0;
	private long lastRun = 0L;
	private final AtomicBoolean highActivity = new AtomicBoolean(false);
	public HappeningsTask(ComboPooledDataSource pool, NationCache cache, NationStates api) {
		this.api = api;
		this.pool = pool;
		this.cache = cache;
	}

	public boolean isHighActivity() {
		return highActivity.get();
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
		HappeningData data;
		synchronized (api) {
			//Throttle the happening queries based on how many new happenings occured last run
			boolean highActivity = false;
			if (lastRun + Duration.standardSeconds(10).getMillis() > System.currentTimeMillis()) {
				if (newEvents < 25) {
					Logger.debug("Skipping happening run, too recent");
					return;
				} else {
					Logger.debug("Not skipping happening run - very active");
					highActivity = true;
				}
			}
			this.highActivity.set(highActivity);
			lastRun = System.currentTimeMillis();
			newEvents = 0;
			Logger.info("Starting global happenings run. Max Event ID: " + maxEventId);
			try {
				data = api.getHappeningInfo(null, -1, maxEventId);
			} catch (RateLimitReachedException e) {
				Logger.warn("Happenings monitoring rate limited!");
				return;
			}
			for (EventHappening happening : data.happenings) {
				if (maxEventId < happening.eventId) {
					maxEventId = happening.eventId;
					newEvents++;
				}
			}
		}
		Connection conn = null;
		try {
			conn = pool.getConnection();
			PreparedStatement batchInsert = conn.prepareStatement("INSERT INTO assembly.global_happenings (nation, happening, timestamp) VALUES (?, ?, ?)");
			for (EventHappening happening : data.happenings) {
				final String text = happening.text;
				final long timestamp = happening.timestamp * 1000;
				Matcher match = Utils.NATION_PATTERN.matcher(text);
				if (match.find()) {
					String nation = text.substring(match.start() + 2, match.end() - 2);
					final long lastUpdate = getLastUpdate(conn, nation);
					if (timestamp > lastUpdate) {
						int nationId = cache.getNationId(nation);
						if (nationId == -1) {
							PreparedStatement insert = conn.prepareStatement("INSERT INTO assembly.nation (name, formatted_name, region, needs_update) VALUES (?, ?, ?, ?)", Statement.RETURN_GENERATED_KEYS);
							insert.setString(1, nation);
							insert.setString(2, WordUtils.capitalizeFully(nation.replaceAll("_", " ")));
							insert.setString(3, "");
							insert.setByte(4, (byte) 1);
							insert.executeUpdate();
							ResultSet keys = insert.getGeneratedKeys();
							keys.next();
							nationId = keys.getInt(1);
						}
						batchInsert.setString(1, nation);
						batchInsert.setString(2, parseHappening(text));
						batchInsert.setLong(3, timestamp);
						batchInsert.addBatch();
						
						setLastUpdate(conn, nation, timestamp);
					}
				}
			}
			batchInsert.executeBatch();
		} catch (SQLException e) {
			Logger.error("Unable to update happenings", e);
		} finally {
			DbUtils.closeQuietly(conn);
		}
	}
}
