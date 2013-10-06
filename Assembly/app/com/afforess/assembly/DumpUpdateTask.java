package com.afforess.assembly;

import java.io.File;
import java.io.FileNotFoundException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashSet;
import java.util.concurrent.ExecutionException;

import org.apache.commons.dbutils.DbUtils;

import play.Logger;

import com.afforess.assembly.util.DatabaseAccess;
import com.afforess.assembly.util.Utils;
import com.afforess.nsdump.NationsDump;
import com.afforess.nsdump.RegionsDump;
import com.mchange.v2.c3p0.ComboPooledDataSource;

public class DumpUpdateTask implements Runnable {
	private final File regionDump;
	private final File nationDump;
	private final ComboPooledDataSource pool;
	private final DatabaseAccess access;
	public DumpUpdateTask(DatabaseAccess access, File regionDump, File nationDump) {
		this.pool = access.getPool();
		this.access = access;
		this.regionDump = regionDump;
		this.nationDump = nationDump;
	}

	@Override
	public void run() {
		try {
			Logger.info("Starting daily dumps update task");
			RegionsDump regions = new RegionsDump(regionDump);
			regions.parse();
			updateRegions(regions);
			
			NationsDump nations = new NationsDump(nationDump);
			nations.parse();
			updateNations(nations);
			
			Logger.info("Finished daily dumps update task");
		} catch (FileNotFoundException e) {
			throw new RuntimeException(e);
		}
	}

	private void updateRegions(RegionsDump dump) {
		Connection conn = null;
		Connection assembly = null;
		try {
			conn = dump.getDatabaseConnection();
			PreparedStatement statement = conn.prepareStatement("SELECT name FROM regions");
			ResultSet result = statement.executeQuery();
			final HashSet<String> set = new HashSet<String>(20000);
			while (result.next()) {
				set.add(result.getString(1));
			}
			Logger.info("Updating " + set.size() + " regions from daily dump");
			PreparedStatement select = conn.prepareStatement("SELECT title, flag, delegate, founder, numnations FROM regions WHERE name = ?");
			int newRegions = 0;
			for (String region : set) {
				select.setString(1, region);
				result = select.executeQuery();
				result.next();
				newRegions += updateRegion(region, result.getString(1), result.getString(2), result.getString(3), result.getString(4), result.getInt(5));
				try {
					Thread.sleep(1);
				} catch (InterruptedException e) { }
			}
			
			Logger.info("Added " + newRegions + " regions to the database");
			assembly = pool.getConnection();
			HashSet<String> allRegions = new HashSet<String>(20000);
			select = assembly.prepareStatement("SELECT name FROM assembly.region");
			result = select.executeQuery();
			while (result.next()) {
				allRegions.add(result.getString(1));
			}
			allRegions.removeAll(set);
			Logger.info("Marking " + allRegions.size() + " regions as dead");
			
			PreparedStatement markDead = assembly.prepareStatement("UPDATE assembly.region SET alive = 0 WHERE name = ?");
			for (String region : allRegions) {
				markDead.setString(1, region);
				markDead.addBatch();
			}
			markDead.executeBatch();
			conn.prepareStatement("DROP TABLE regions").execute();
		} catch (SQLException e) {
			throw new RuntimeException(e);
		} finally {
			DbUtils.closeQuietly(conn);
			DbUtils.closeQuietly(assembly);
		}
	}

	private int updateRegion(String region, String title, String flag, String delegate, String founder, int numNations) throws SQLException {
		Connection conn = pool.getConnection();
		try {
			PreparedStatement select = conn.prepareStatement("SELECT id FROM assembly.region WHERE name = ?");
			select.setString(1, region);
			ResultSet result = select.executeQuery();
			int regionId = -1;
			if (result.next()) {
				regionId = result.getInt(1);
			}

			Logger.info("Updating region [" + region + "] from the daily dump");

			PreparedStatement insert = null;
			insert = conn.prepareStatement("INSERT INTO assembly.region_populations (region, population, timestamp) VALUES (?, ?, ?)");
			insert.setString(1, region);
			insert.setInt(2, numNations);
			insert.setLong(3, System.currentTimeMillis());
			insert.executeUpdate();

			PreparedStatement update = null;
			if (regionId == -1) {
				update = conn.prepareStatement("INSERT INTO assembly.region (name, title, flag, delegate, founder) VALUES (?, ?, ?, ?, ?)");
				update.setString(1, region);
				update.setString(2, title);
				update.setString(3, flag);
				update.setString(4, delegate);
				update.setString(5, founder);
				update.executeUpdate();
				return 1;
			} else {
				update = conn.prepareStatement("UPDATE assembly.region SET title = ?, flag = ?, delegate = ?, founder = ? WHERE id = ?");
				update.setString(1, title);
				update.setString(2, flag);
				update.setString(3, delegate);
				update.setString(4, founder);
				update.setInt(5, regionId);
				update.executeUpdate();
				return 0;
			}
		} finally {
			DbUtils.closeQuietly(conn);
		}
	}

	private void updateNations(NationsDump dump) {
		Connection conn = null;
		Connection assembly = null;
		try {
			conn = dump.getDatabaseConnection();
			PreparedStatement statement = conn.prepareStatement("SELECT name FROM nations");
			ResultSet result = statement.executeQuery();
			final HashSet<String> set = new HashSet<String>(150000);
			while (result.next()) {
				set.add(result.getString(1));
			}
			DbUtils.closeQuietly(result);
			Logger.info("Updating " + set.size() + " nations from daily dump");
			PreparedStatement select = conn.prepareStatement("SELECT title, fullname, unstatus, influence, lastlogin, flag, region FROM nations WHERE name = ?");
			int newNations = 0;
			for (String nation : set) {
				select.setString(1, nation);
				result = select.executeQuery();
				result.next();
				newNations += updateNation(nation, result.getString(1), result.getString(2), !result.getString(3).toLowerCase().equals("non-member"), result.getString(4), result.getInt(5), result.getString(6), result.getString(7));
				try {
					Thread.sleep(1);
				} catch (InterruptedException e) { }
			}
			Logger.info("Added " + newNations + " nations to the database");
			assembly = pool.getConnection();
			HashSet<String> allNations = new HashSet<String>(150000);
			select = assembly.prepareStatement("SELECT name FROM assembly.nation WHERE alive = 1");
			result = select.executeQuery();
			while (result.next()) {
				allNations.add(result.getString(1));
			}
			allNations.removeAll(set);
			Logger.info("Marking " + allNations.size() + " nations as dead");
			for (String nation : allNations) {
				try {
					access.markNationDead(nation, assembly);
				} catch (ExecutionException e) {
					Logger.warn("Unknown nation: " + nation, e);
				}
			}
			conn.prepareStatement("DROP TABLE nations").execute();
			int cleanupNations = 0;
			result = assembly.prepareStatement("SELECT id FROM assembly.nation WHERE alive = 0 AND wa_member = 1").executeQuery();
			while(result.next()) {
				access.markNationDead(result.getInt(1), assembly);
				cleanupNations++;
			}
			Logger.info("Cleaned up " + cleanupNations + " who were dead World Assembly Member nations!");
		} catch (SQLException e) {
			throw new RuntimeException(e);
		} finally {
			DbUtils.closeQuietly(conn);
			DbUtils.closeQuietly(assembly);
		}
	}

	private int updateNation(String nation, String title, String fullName,  boolean waMember, String influence, int lastLogin, String flag, String region) throws SQLException {
		Connection conn = pool.getConnection();
		int id = -1;
		try {
			PreparedStatement select = conn.prepareStatement("SELECT id FROM assembly.nation WHERE name = ?");
			select.setString(1, nation);
			ResultSet result = select.executeQuery();
			if (result.next()) {
				id = result.getInt(1);
			}
			select = conn.prepareStatement("SELECT id FROM assembly.region WHERE name = ?");
			select.setString(1, Utils.sanitizeName(region));
			result = select.executeQuery();
			int regionId = -1;
			if (result.next()) {
				regionId = result.getInt(1);
			}
			Logger.info("Updating nation [" + nation + "] from the daily dump");
			PreparedStatement insert = null;
			if (id == -1) {
				insert = conn.prepareStatement("INSERT INTO assembly.nation (name, title, full_name, flag, region, influence_desc, last_login, wa_member, alive, first_seen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
				insert.setString(1, nation);
				insert.setString(2, title);
				insert.setString(3, fullName);
				insert.setString(4, flag);
				insert.setInt(5, regionId);
				insert.setString(6, influence);
				insert.setInt(7, lastLogin);
				insert.setByte(8, (byte)(waMember ? 1 : 0));
				insert.setByte(9, (byte)1);
				insert.setLong(10, System.currentTimeMillis() / 1000L);
				insert.executeUpdate();
				return 1;
			} else {
				insert = conn.prepareStatement("UPDATE assembly.nation SET full_name = ?, title = ?, flag = ?, region = ?, influence_desc = ?, last_login = ?, wa_member = ? WHERE id = ?");
				insert.setString(1, fullName);
				insert.setString(2, title);
				insert.setString(3, flag);
				insert.setInt(4, regionId);
				insert.setString(5, influence);
				insert.setInt(6, lastLogin);
				insert.setByte(7, (byte)(waMember ? 1 : 0));
				insert.setInt(8, id);
				insert.executeUpdate();
				return 0;
			}
		} finally {
			DbUtils.closeQuietly(conn);
		}
	}
}
