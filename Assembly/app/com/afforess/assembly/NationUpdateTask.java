package com.afforess.assembly;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import org.apache.commons.dbutils.DbUtils;
import org.joda.time.Duration;

import play.Logger;

import com.afforess.assembly.util.DatabaseAccess;
import com.afforess.assembly.util.Utils;
import com.limewoodMedia.nsapi.NationStates;
import com.limewoodMedia.nsapi.exceptions.RateLimitReachedException;

public class NationUpdateTask implements Runnable {
	private final NationStates api;
	private final DatabaseAccess access;
	private final int waUpdates;
	private final int nonWaUpdates;
	private final HealthMonitor monitor;
	private long lastRun = 0;
	private final HappeningsTask task;
	public NationUpdateTask(NationStates api, DatabaseAccess access, int waUpdates, int nonWaUpdates, HealthMonitor health, HappeningsTask task) {
		this.api = api;
		this.access = access;
		this.waUpdates = waUpdates;
		this.nonWaUpdates = nonWaUpdates;
		this.monitor = health;
		this.task = task;
	}

	@Override
	public void run() {
		if (lastRun + Duration.standardSeconds(30).getMillis() > System.currentTimeMillis()) {
			Logger.info("Skipping nation updates, too soon.");
			return;
		}
		lastRun = System.currentTimeMillis();
		Connection conn = null;
		PreparedStatement select = null;
		ResultSet result = null;
		try {
			if (task.isHighActivity()) {
				Logger.info("Skipping nation updates run, high happenings activity");
				return;
			}
			
			final int waLimit = Math.min((api.getRateLimitRemaining() * 2) / 3, this.waUpdates);
			if (waLimit <= 1) {
				Logger.info("Skipping wa nation updates, no rate limit remaining");
				return;
			}
			
			conn = access.getPool().getConnection();
			
			select = conn.prepareStatement("SELECT id, name FROM assembly.nation WHERE alive = 1 AND wa_member <> 0 AND last_endorsement_baseline < ? ORDER BY last_endorsement_baseline ASC LIMIT 0, " + waLimit);
			select.setLong(1, System.currentTimeMillis() - Duration.standardHours(12).getMillis());
			result = select.executeQuery();
			while(result.next()) {
				final int id = result.getInt(1);
				final String name = result.getString(2);
				
				Utils.updateNation(conn, access, api, name, id);
				Logger.info("Updated shard baseline for [" + name + "]");
			}
			
			DbUtils.closeQuietly(result);
			DbUtils.closeQuietly(select);
			
			final int nonWaLimit = Math.min((api.getRateLimitRemaining() * 2) / 3, this.nonWaUpdates);
			if (nonWaLimit <= 1) {
				Logger.info("Skipping non-wa nation updates, no rate limit remaining");
				return;
			}
			
			select = conn.prepareStatement("SELECT id, name FROM assembly.nation WHERE alive = 1 AND last_endorsement_baseline < ? ORDER BY last_endorsement_baseline ASC LIMIT 0, " + nonWaLimit);
			select.setLong(1, System.currentTimeMillis() - Duration.standardHours(24).getMillis());
			result = select.executeQuery();
			while(result.next()) {
				final int id = result.getInt(1);
				final String name = result.getString(2);
				
				Utils.updateNation(conn, access, api, name, id);
				Logger.info("Updated shard baseline for [" + name + "]");
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
}