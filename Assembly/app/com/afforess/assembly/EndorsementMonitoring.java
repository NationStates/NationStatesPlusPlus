package com.afforess.assembly;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Savepoint;

import org.apache.commons.dbutils.DbUtils;
import org.joda.time.Duration;

import play.Logger;

import com.afforess.assembly.util.DatabaseAccess;
import com.afforess.assembly.util.Utils;
import com.limewoodMedia.nsapi.NationStates;
import com.limewoodMedia.nsapi.enums.WAStatus;
import com.limewoodMedia.nsapi.exceptions.RateLimitReachedException;
import com.limewoodMedia.nsapi.exceptions.UnknownNationException;
import com.limewoodMedia.nsapi.holders.NationData;
import com.limewoodMedia.nsapi.holders.NationData.Shards;

public class EndorsementMonitoring implements Runnable {
	private final NationStates api;
	private final DatabaseAccess access;
	private final int limit;
	private final HealthMonitor monitor;
	private long lastRun = 0;
	private final HappeningsTask task;
	public EndorsementMonitoring(NationStates api, DatabaseAccess access, int limit, HealthMonitor health, HappeningsTask task) {
		this.api = api;
		this.access = access;
		this.limit = limit;
		this.monitor = health;
		this.task = task;
	}

	@Override
	public void run() {
		if (lastRun + Duration.standardSeconds(30).getMillis() > System.currentTimeMillis()) {
			Logger.info("Skipping endorsement run, too soon.");
			return;
		}
		lastRun = System.currentTimeMillis();
		Connection conn = null;
		PreparedStatement select = null;
		ResultSet result = null;
		try {
			if (task.isHighActivity()) {
				Logger.info("Skipping endorsement run, high happenings activity");
				return;
			}
			final int limit = Math.min(api.getRateLimitRemaining() / 2, this.limit);
			if (limit <= 1) {
				Logger.info("Skipping endorsement run, no rate limit remaining");
				return;
			}
			conn = access.getPool().getConnection();
			select = conn.prepareStatement("SELECT id, name FROM assembly.nation WHERE alive = 1 AND wa_member <> 0 AND last_endorsement_baseline < ? ORDER BY last_endorsement_baseline ASC LIMIT 0, " + limit);
			select.setLong(1, System.currentTimeMillis() - Duration.standardHours(12).getMillis());
			result = select.executeQuery();
			while(result.next()) {
				final int id = result.getInt(1);
				final String name = result.getString(2);
				NationData.Shards.CENSUS_SCORE.clearIds();
				NationData.Shards.CENSUS_SCORE.addIds(65);
				try {
					NationData data = api.getNationInfo(name, Shards.ENDORSEMENTS, Shards.WA_STATUS, Shards.INFLUENCE, Shards.CENSUS_SCORE, Shards.FLAG, Shards.FULL_NAME, Shards.NAME, Shards.LAST_LOGIN, Shards.REGION);

					PreparedStatement updateNation = conn.prepareStatement("UPDATE assembly.nation SET influence = ?, influence_desc = ?, flag = ?, full_name = ?, title = ?, last_login = ?, last_endorsement_baseline = ?, wa_member = ?, region = ? WHERE id = ?");
					updateNation.setInt(1, data.censusScore.get(65).intValue());
					updateNation.setString(2, data.influence);
					updateNation.setString(3, data.flagURL);
					updateNation.setString(4, data.fullName);
					updateNation.setString(5, data.name);
					updateNation.setLong(6, data.lastLogin);
					updateNation.setLong(7, System.currentTimeMillis());
					updateNation.setByte(8, (byte)(data.worldAssemblyStatus != WAStatus.NON_MEMBER ? 1 : 0));
					updateNation.setInt(9, access.getRegionIdCache().get(Utils.sanitizeName(data.region)));
					updateNation.setInt(10, id);
					updateNation.executeUpdate();
					DbUtils.closeQuietly(updateNation);
					
					updateEndorsements(conn, data, id);
					
					Logger.info("Updated endorsement baseline for [" + data.name + "]");
				} catch (UnknownNationException e) {
					access.markNationDead(id, conn);
				}
			}
		} catch (RateLimitReachedException e) {
			Logger.warn("Endorsement monitoring rate limited!");
		} catch (Exception e) {
			Logger.error("Unable to update endorsements", e);
		} finally {
			DbUtils.closeQuietly(result);
			DbUtils.closeQuietly(select);
			DbUtils.closeQuietly(conn);
			if (monitor != null) monitor.endorsementHeartbeat();
		}
	}

	private void updateEndorsements(final Connection conn, final NationData data, final int nationId) throws Exception {
		conn.setAutoCommit(false);
		Savepoint save =  conn.setSavepoint();
		try {
			PreparedStatement endorsements = conn.prepareStatement("INSERT INTO assembly.endorsements (endorser, endorsed) VALUES (?, ?)");
			for (String endorsed : data.endorsements) {
				if (endorsed.trim().length() > 0) {
					endorsements.setInt(1, access.getNationIdCache().get(endorsed));
					endorsements.setInt(2, nationId);
					endorsements.addBatch();
				}
			}

			PreparedStatement hasEndorsement = conn.prepareStatement("DELETE FROM assembly.endorsements WHERE endorsed = ?");
			hasEndorsement.setInt(1, nationId);
			hasEndorsement.executeUpdate();
			DbUtils.closeQuietly(hasEndorsement);
			
			endorsements.executeBatch();
			DbUtils.closeQuietly(endorsements);
			
			PreparedStatement updateEndorsementTrends = conn.prepareStatement("INSERT INTO assembly.nation_endorsement_trends (nation, endorsements, timestamp) VALUES (?, ?, ?)");
			updateEndorsementTrends.setInt(1, nationId);
			updateEndorsementTrends.setInt(2, data.endorsements.length);
			updateEndorsementTrends.setLong(3, System.currentTimeMillis());
			updateEndorsementTrends.executeUpdate();
			DbUtils.closeQuietly(updateEndorsementTrends);
			
			conn.commit();
			conn.releaseSavepoint(save);
		} catch (Exception e) {
			conn.rollback(save);
			Logger.error("Rolling back endorsement transaction");
			throw e;
		} finally {
			conn.setAutoCommit(true);
		}
	}
}
