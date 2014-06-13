package com.afforess.assembly;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashSet;
import java.util.regex.Matcher;

import org.apache.commons.dbutils.DbUtils;
import org.joda.time.Duration;

import play.Logger;

import com.afforess.assembly.util.DatabaseAccess;
import com.limewoodMedia.nsapi.NationStates;
import com.limewoodMedia.nsapi.enums.WACouncil;
import com.limewoodMedia.nsapi.holders.WAData;
import com.limewoodMedia.nsapi.holders.WAResolution;

public class WorldAssemblyTask implements Runnable {
	private final static WACouncil[] WA_COUNCILS =  { WACouncil.GENERAL_ASSEMBLY, WACouncil.SECURITY_COUNCIL };
	private final DatabaseAccess database;
	private final NationStates api;
	private final int council;
	private boolean firstRun = true;
	public WorldAssemblyTask(DatabaseAccess database, NationStates api, int council) {
		this.database = database;
		this.api = api;
		this.council = council;
	}

	private long firstRun() throws SQLException {
		WAData data = api.getWAInfo(WA_COUNCILS[council], WAData.Shards.RESOLUTION);
		WAResolution res = data.resolution;
		Connection conn = null;
		try {
			conn = database.getPool().getConnection();
			PreparedStatement select = conn.prepareStatement("SELECT created FROM assembly.wa_resolutions WHERE created = ? AND council = ?");
			select.setLong(1, res.created * 1000L);
			select.setInt(2, council);
			ResultSet result = select.executeQuery();
			if (!result.next()) {
				insertWAResolution(res, conn);
			}
			DbUtils.closeQuietly(result);
			DbUtils.closeQuietly(select);

			int resId = getResolutionId(conn, res.created * 1000L);
			getLastWAVoteTime(conn, resId);

			long lastUpdate = getLastWAVoteTime(conn, resId);
			if (lastUpdate != -1) {
				return ((lastUpdate / 1000L) - res.created) % 3600;
			}
			return 1;
		} finally {
			DbUtils.closeQuietly(conn);
		}
	}

	private void insertWAResolution(WAResolution res, Connection conn) throws SQLException {
		if (res.category != null) {
			PreparedStatement insert = conn.prepareStatement("INSERT INTO assembly.wa_resolutions (category, created, wa_resolutions.desc, name, proposer, council) VALUES (?, ?, ?, ?, ?, ?)");
			insert.setString(1, res.category);
			insert.setLong(2, res.created * 1000L);
			insert.setString(3, res.description);
			insert.setString(4, res.name);
			insert.setString(5, res.proposedBy);
			insert.setInt(6, council);
			insert.executeUpdate();
			DbUtils.closeQuietly(insert);
		}
	}

	private void runSafe() throws Exception {
		if (firstRun) {
			Logger.info("Executing first WA Update for council: " + council);
			long nextUpdate = firstRun();
			firstRun = false;
			
			Logger.info("First WA run update complete, next update in " + nextUpdate + " seconds");
			RepeatingTaskThread thread = new RepeatingTaskThread(Duration.standardSeconds(nextUpdate), null, this);
			thread.start();
		} else {
			Logger.info("Executing WA Update for council: " + council);
			RepeatingTaskThread thread = new RepeatingTaskThread(Duration.standardHours(1), null, this);
			thread.start();
			updateVotes();
		}
	}

	private long getLastWAVoteTime(Connection conn, int resolution) throws SQLException {
		PreparedStatement select = null;
		ResultSet result = null;
		try {
			select = conn.prepareStatement("SELECT timestamp FROM assembly.wa_votes WHERE wa_resolution = ? ORDER BY timestamp DESC LIMIT 0, 1");
			select.setInt(1, resolution);
			result = select.executeQuery();
			if (result.next())
				return result.getLong(1);
		} finally {
			DbUtils.closeQuietly(result);
			DbUtils.closeQuietly(select);
		}
		return -1;
	}

	private int getResolutionId(Connection conn, long created) throws SQLException {
		PreparedStatement select = null;
		ResultSet result = null;
		try {
			select = conn.prepareStatement("SELECT id FROM assembly.wa_resolutions WHERE created = ? AND council = ?");
			select.setLong(1, created);
			select.setInt(2, council);
			result = select.executeQuery();
			if (result.next())
				return result.getInt(1);
		} finally {
			DbUtils.closeQuietly(result);
			DbUtils.closeQuietly(select);
		}
		return -1;
	}

	private void updateVotes() throws SQLException {
		WAData data = api.getWAInfo(WA_COUNCILS[council], WAData.Shards.RESOLUTION);
		WAResolution res = data.resolution;
		if (data.resolution.category == null) {
			return;
		}
		Connection conn = null;
		try {
			conn = database.getPool().getConnection();
			HashSet<Integer> votesFor = new HashSet<Integer>();
			HashSet<Integer> votesAgainst = new HashSet<Integer>();
			PreparedStatement select = conn.prepareStatement("SELECT nation, type FROM assembly.global_happenings WHERE timestamp > ? AND (type = 20 OR type = 21) AND happening LIKE ? ORDER BY timestamp ASC");
			select.setLong(1, res.created * 1000L);
			select.setString(2, "%" + res.name.replaceAll(String.valueOf('"'), Matcher.quoteReplacement("&quot;")).replaceAll("'", Matcher.quoteReplacement("\\'")) + "%");
			ResultSet votes = select.executeQuery();
			while(votes.next()) {
				boolean voteFor = votes.getInt(2) == 20;
				int nation = votes.getInt(1);
				if (voteFor) {
					votesFor.add(nation);
					votesAgainst.remove(nation);
				} else {
					votesAgainst.add(nation);
					votesFor.remove(nation);
				}
			}

			int resId = getResolutionId(conn, res.created * 1000L);
			if (resId == -1) {
				insertWAResolution(res, conn);
				resId = getResolutionId(conn, res.created * 1000L);
			}

			if (resId == -1) {
				Logger.error("Unknown WA Resolution: " + res.name);
				throw new IllegalStateException("Unknown WA Resolution: " + res.name);
			}

			PreparedStatement insert = conn.prepareStatement("INSERT INTO assembly.wa_votes (wa_resolution, delegate_votes_against, delegate_votes_for, nation_votes_against, nation_votes_for, timestamp) VALUES (?, ?, ?, ?, ?, ?)");
			insert.setInt(1, resId);
			insert.setInt(2, res.votesAgainst);
			insert.setInt(3, res.votesFor);
			insert.setInt(4, votesAgainst.size());
			insert.setInt(5, votesFor.size());
			insert.setLong(6, System.currentTimeMillis());
			insert.executeUpdate();
		} finally {
			DbUtils.closeQuietly(conn);
		}
	}

	@Override
	public void run() {
		try {
			runSafe();
		} catch (Exception e) {
			Logger.error("Exception handling World Assembly update", e);
		}
	}
}
