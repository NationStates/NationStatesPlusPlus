package com.afforess.assembly;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Savepoint;

import org.apache.commons.dbutils.DbUtils;
import org.joda.time.Duration;

import play.Logger;

import com.afforess.assembly.util.DatabaseAccess;
import com.limewoodMedia.nsapi.NationStates;
import com.limewoodMedia.nsapi.enums.WAStatus;
import com.limewoodMedia.nsapi.exceptions.UnknownNationException;
import com.limewoodMedia.nsapi.holders.NationData;
import com.limewoodMedia.nsapi.holders.NationData.Shards;

public class EndorsementMonitoring implements Runnable {
	private final NationStates api;
	private final DatabaseAccess access;
	private final int limit;
	public EndorsementMonitoring(NationStates api, DatabaseAccess access, int limit) {
		this.api = api;
		this.access = access;
		this.limit = limit;
	}

	@Override
	public void run() {
		Connection conn = null;
		try {
			conn = access.getPool().getConnection();
			PreparedStatement select = conn.prepareStatement("SELECT id, name FROM assembly.nation WHERE alive = 1 AND wa_member = 1 AND last_endorsement_baseline < ? ORDER BY last_endorsement_baseline ASC LIMIT 0, " + limit);
			select.setLong(1, System.currentTimeMillis() - Duration.standardHours(24).getMillis());
			ResultSet result = select.executeQuery();
			while(result.next()) {
				final int id = result.getInt(1);
				final String name = result.getString(2);
				NationData.Shards.CENSUS_SCORE.clearIds();
				NationData.Shards.CENSUS_SCORE.addIds(65);
				try {
					NationData data = api.getNationInfo(name, Shards.ENDORSEMENTS, Shards.WA_STATUS, Shards.INFLUENCE, Shards.CENSUS_SCORE, Shards.FLAG, Shards.FULL_NAME, Shards.NAME, Shards.LAST_LOGIN);
					
					PreparedStatement updateNation = conn.prepareStatement("UPDATE assembly.nation SET influence = ?, influence_desc = ?, flag = ?, full_name = ?, title = ?, last_login = ?, last_endorsement_baseline = ?, wa_member = ? WHERE id = ?");
					updateNation.setInt(1, data.censusScore.get(65).intValue());
					updateNation.setString(2, data.influence);
					updateNation.setString(3, data.flagURL);
					updateNation.setString(4, data.fullName);
					updateNation.setString(5, data.name);
					updateNation.setLong(6, data.lastLogin);
					updateNation.setLong(7, System.currentTimeMillis());
					updateNation.setByte(8, (byte)(data.worldAssemblyStatus != WAStatus.NON_MEMBER ? 1 : 0));
					updateNation.setInt(9, id);
					updateNation.executeUpdate();
					
					updateEndorsements(conn, data, id);
					
					Logger.info("Updated endorsement baseline for [" + data.name + "]");
				} catch (UnknownNationException e) {
					access.markNationDead(id, conn);
				}
			}
		} catch (Exception e) {
			Logger.error("Unable to update endorsements", e);
		} finally {
			DbUtils.closeQuietly(conn);
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
			hasEndorsement.execute();
			hasEndorsement.close();
			
			endorsements.executeBatch();
			endorsements.close();
			
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
