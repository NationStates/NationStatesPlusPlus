package com.afforess.assembly;

import java.io.File;
import java.lang.ProcessBuilder.Redirect;
import java.sql.Connection;
import java.util.concurrent.atomic.AtomicLong;

import org.apache.commons.dbutils.DbUtils;
import org.spout.cereal.config.ConfigurationNode;

import com.afforess.assembly.util.DatabaseAccess;

import play.Logger;
import play.api.Play;

public class HealthMonitor extends Thread {
	private static final long HAPPENINGS_TIME = 3000L;
	private static final long ENDORSEMENT_TIME = 30000L;
	private final String restartCommand;
	/**
	 * The number of times a happenings 'heartbeat' can be missed before the application is 'unresponsive'.
	 */
	private final int happeningsThreshold;
	/**
	 * The number of times endorsement monitoring runs can be missed before the application is 'unresponsive'.
	 */
	private final int endorsementThreshold;
	private final AtomicLong lastHappeningHeartbeat = new AtomicLong(System.currentTimeMillis() + HAPPENINGS_TIME);
	private final AtomicLong lastEndorsementHeartbeat = new AtomicLong(System.currentTimeMillis() + ENDORSEMENT_TIME);
	private final DatabaseAccess access;
	public HealthMonitor(ConfigurationNode config, DatabaseAccess access) {
		super("Health Monitor Thread");
		this.access = access;
		restartCommand = config.getChild("restart-command").getString();
		happeningsThreshold = config.getChild("happenings-threshold").getInt();
		endorsementThreshold = config.getChild("endorsement-threshold").getInt();
	}

	public void happeningHeartbeat() {
		this.lastHappeningHeartbeat.set(System.currentTimeMillis());
	}

	public void endorsementHeartbeat() {
		this.lastEndorsementHeartbeat.set(System.currentTimeMillis());
	}

	@Override
	public void run() {
		while(!this.isInterrupted()) {
			final long time = System.currentTimeMillis();
			boolean unresponsive = false;

			long lastHappening = time - lastHappeningHeartbeat.get();
			Logger.debug("[HEALTH CHECK] Time since happenings run: " + lastHappening);
			if (lastHappening / HAPPENINGS_TIME > happeningsThreshold) {
				Logger.warn("Happening Monitoring Runs have exceeded 100% of the missing time threshold.");
				Logger.error("APPLICATION UNRESPONSIVE. LAST HEARTBEAT: " + lastHappeningHeartbeat.get());
				unresponsive = true;
			} else if (lastHappening / HAPPENINGS_TIME > (happeningsThreshold / 2 + 1)) {
				Logger.warn("Happening Monitoring Runs have exceeded 51% of the missing time threshold.");
			}
			
			long lastEndorun = time - lastEndorsementHeartbeat.get();
			Logger.debug("[HEALTH CHECK] Time since endorsement run: " + lastEndorun);
			if (lastEndorun / ENDORSEMENT_TIME > endorsementThreshold) {
				Logger.warn("Endorsement Monitoring runs have exceeded 100% of the missing time threshold.");
				Logger.error("APPLICATION UNRESPONSIVE. LAST HEARTBEAT: " + lastEndorsementHeartbeat.get());
				unresponsive = true;
			} else if (lastEndorun / ENDORSEMENT_TIME > (endorsementThreshold / 2 + 1)) {
				Logger.warn("Endorsement Monitoring Runs have exceeded 51% of the missing time threshold.");
			}
			
			ConnectionTestThread connTest = new ConnectionTestThread();
			boolean sqlAlive = false;
			connTest.start();
			try {
				connTest.join(60 * 1000L);
				sqlAlive = connTest.success;
			} catch (InterruptedException e1) {
				Logger.error("Mysql Connection Test thread not responding");
			}
			
			if (unresponsive || !sqlAlive) {
				Logger.error("Attempting Application Restart.");
				try { Play.stop(); } catch (Throwable t) { Logger.error("Error stopping play!", t); }
				try {
					(new File("RUNNING_PID")).delete();
					ProcessBuilder builder = new ProcessBuilder();
					builder.command(restartCommand.split(","));
					builder.redirectOutput(Redirect.INHERIT);
					builder.redirectError(Redirect.INHERIT);
					builder.start();
					System.exit(0);
				} catch (Throwable t) {
					Logger.error("Unable to restart application!", t);
				}
			}
			
			try {
				Thread.sleep(30000);
			} catch (InterruptedException e) {
				Logger.warn("Health Monitoring Interrupted", e);
				return;
			}
		}
	}

	private class ConnectionTestThread extends Thread {
		boolean success = false;
		@Override
		public void run() {
			Connection conn = null;
			try {
				conn = access.getPool().getConnection();
				success = conn.prepareStatement("SELECT 1").execute();
			} catch (Throwable t) {
				Logger.error("Unable to open connection", t);
			} finally {
				DbUtils.closeQuietly(conn);
			}
		}
	}
}
