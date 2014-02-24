package com.afforess.assembly;

import java.io.File;
import java.io.FileNotFoundException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
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
			Logger.info("Starting daily dumps update task with [" + regionDump.getName() + " & " + nationDump.getName() + "]");
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
			DbUtils.closeQuietly(result);
			Logger.info("Updating " + set.size() + " regions from daily dump");
			PreparedStatement select = conn.prepareStatement("SELECT title, flag, delegate, founder, numnations FROM regions WHERE name = ?");
			int newRegions = 0;
			for (String region : set) {
				select.setString(1, region);
				result = select.executeQuery();
				result.next();
				newRegions += updateRegion(region, result.getString(1), result.getString(2), result.getString(3), result.getString(4), result.getInt(5));
				DbUtils.closeQuietly(result);
				try {
					Thread.sleep(1);
				} catch (InterruptedException e) { }
			}
			
			Logger.info("Added " + newRegions + " regions to the database");
			assembly = pool.getConnection();
			HashSet<String> allRegions = new HashSet<String>(20000);
			select = assembly.prepareStatement("SELECT name FROM assembly.region WHERE alive = 1");
			result = select.executeQuery();
			while (result.next()) {
				allRegions.add(result.getString(1));
			}
			DbUtils.closeQuietly(result);
			allRegions.removeAll(set);
			Logger.info("Marking " + allRegions.size() + " regions as dead");
			
			PreparedStatement markDead = assembly.prepareStatement("UPDATE assembly.region SET alive = 0 WHERE name = ?");
			for (String region : allRegions) {
				markDead.setString(1, region);
				markDead.addBatch();
			}
			markDead.executeBatch();
			conn.prepareStatement("DROP TABLE regions").execute();
			conn.prepareStatement("SHUTDOWN COMPACT").execute();
		} catch (Exception e) {
			Logger.error("unable to update region dumps", e);
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

			Logger.info("Updating region [" + region + "] from the daily dump [numnations: " + numNations + "]");

			PreparedStatement insert = null;
			insert = conn.prepareStatement("INSERT INTO assembly.region_populations (region, population, timestamp) VALUES (?, ?, ?)");
			insert.setString(1, region);
			insert.setInt(2, numNations);
			insert.setLong(3, System.currentTimeMillis());
			insert.executeUpdate();
			DbUtils.closeQuietly(insert);
			
			if (flag.startsWith("http://")) {
				flag = "//" + flag.substring(7);
			}

			PreparedStatement update = null;
			if (regionId == -1) {
				update = conn.prepareStatement("INSERT INTO assembly.region (name, title, flag, delegate, founder, alive, population) VALUES (?, ?, ?, ?, ?, 1, ?)");
				update.setString(1, region);
				update.setString(2, title);
				update.setString(3, flag);
				update.setString(4, delegate);
				update.setString(5, founder);
				update.setInt(6, numNations);
				update.executeUpdate();
				DbUtils.closeQuietly(update);
				return 1;
			} else {
				update = conn.prepareStatement("UPDATE assembly.region SET alive = 1, title = ?, flag = ?, delegate = ?, founder = ?, population = ? WHERE id = ?");
				update.setString(1, title);
				update.setString(2, flag);
				update.setString(3, delegate);
				update.setString(4, founder);
				update.setInt(5, numNations);
				update.setInt(6, regionId);
				update.executeUpdate();
				DbUtils.closeQuietly(update);
				return 0;
			}
		} finally {
			DbUtils.closeQuietly(conn);
		}
	}
	
	private static String[] NATION_FIELDS = new String[] {"motto", "currency", "animal", "capital", "leader", "religion", "category", "civilrights", "economy",
	                                "politicalfreedom", "population", "tax", "majorindustry", "governmentpriority", "environment", "socialequality",
	                                "education", "lawandorder", "administration", "welfare", "spirituality", "defence",	"publictransport",
	                                "healthcare", "commerce", "civilrightscore", "economyscore", "politicalfreedomscore", "publicsector"};

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
			PreparedStatement select = conn.prepareStatement("SELECT title, fullname, unstatus, influence, lastlogin, flag, region, motto," +
					"currency, animal, capital, leader, religion, category, civilrights, economy, politicalfreedom, population, tax, majorindustry," + 
					"governmentpriority, environment, socialequality, education, lawandorder, administration, welfare, spirituality, defence," +
					"publictransport, healthcare, commerce, civilrightscore, economyscore, politicalfreedomscore, publicsector FROM nations WHERE name = ?");
			int newNations = 0;
			
			assembly = pool.getConnection();
			
			Map<String, Integer> columnMapping = null;
			
			for (String nation : set) {
				select.setString(1, nation);
				result = select.executeQuery();
				result.next();
				newNations += updateNation(assembly, nation, result.getString("title"), result.getString("fullname"), !result.getString("unstatus").toLowerCase().equals("non-member"),
						result.getString("influence"), result.getInt("lastlogin"), result.getString("flag"), result.getString("region"));
				
				
				ResultSetMetaData metaData = result.getMetaData();
				int columns = metaData.getColumnCount();
				if (columnMapping == null) {
					columnMapping = new HashMap<String, Integer>();
					for (int i = 1; i <= columns; i++) {
						columnMapping.put(metaData.getColumnName(i).toLowerCase(), i);
					}
				}
				
				//update extra nation fields
				StringBuilder fields = new StringBuilder("UPDATE assembly.nation SET ");
				for (int i = 0; i < NATION_FIELDS.length; i++) {
					fields.append(NATION_FIELDS[i]).append(" = ?");
					if (i != NATION_FIELDS.length - 1) fields.append(", ");
				}
				fields.append(" WHERE name = ?");
				PreparedStatement updateFields = assembly.prepareStatement(fields.toString());
				for (int i = 0; i < NATION_FIELDS.length; i++) {
					updateFields.setObject(i + 1, result.getObject(columnMapping.get(NATION_FIELDS[i])), metaData.getColumnType(columnMapping.get(NATION_FIELDS[i])));
				}
				updateFields.setString(NATION_FIELDS.length + 1, nation);
				updateFields.executeUpdate();
				DbUtils.closeQuietly(updateFields);
				
				DbUtils.closeQuietly(result);
				try {
					Thread.sleep(1);
				} catch (InterruptedException e) { }
			}
			Logger.info("Added " + newNations + " nations to the database");
			
			HashSet<String> allNations = new HashSet<String>(150000);
			select = assembly.prepareStatement("SELECT name FROM assembly.nation WHERE alive = 1");
			result = select.executeQuery();
			while (result.next()) {
				allNations.add(result.getString(1));
			}
			DbUtils.closeQuietly(result);
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
			conn.prepareStatement("SHUTDOWN COMPACT").execute();
			int cleanupNations = 0;
			result = assembly.prepareStatement("SELECT id FROM assembly.nation WHERE alive = 0 AND wa_member = 1").executeQuery();
			while(result.next()) {
				access.markNationDead(result.getInt(1), assembly);
				cleanupNations++;
			}
			DbUtils.closeQuietly(result);
			Logger.info("Cleaned up " + cleanupNations + " who were dead World Assembly Member nations!");
		} catch (SQLException e) {
			Logger.error("unable to update nation dumps", e);
		} finally {
			DbUtils.closeQuietly(conn);
			DbUtils.closeQuietly(assembly);
		}
	}

	private int updateNation(Connection conn, String nation, String title, String fullName,  boolean waMember, String influence, int lastLogin, String flag, String region) throws SQLException {
		int id = -1;
		PreparedStatement select = conn.prepareStatement("SELECT id, wa_member, region FROM assembly.nation WHERE name = ?");
		select.setString(1, nation);
		ResultSet result = select.executeQuery();
		int prevRegion = -1;
		boolean wasWA = false;
		if (result.next()) {
			id = result.getInt(1);
			wasWA = result.getBoolean(2);
			prevRegion = result.getInt(3);
		}
		DbUtils.closeQuietly(result);
		DbUtils.closeQuietly(select);
		
		select = conn.prepareStatement("SELECT id FROM assembly.region WHERE name = ?");
		select.setString(1, Utils.sanitizeName(region));
		result = select.executeQuery();
		int regionId = -1;
		if (result.next()) {
			regionId = result.getInt(1);
		}
		DbUtils.closeQuietly(result);
		DbUtils.closeQuietly(select);
		
		if (flag.startsWith("http://")) {
			flag = "//" + flag.substring(7);
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
			DbUtils.closeQuietly(insert);
			return 1;
		} else {
			insert = conn.prepareStatement("UPDATE assembly.nation SET alive = 1, full_name = ?, title = ?, flag = ?, region = ?, influence_desc = ?, last_login = ?, wa_member = ? WHERE id = ?");
			insert.setString(1, fullName);
			insert.setString(2, title);
			insert.setString(3, flag);
			insert.setInt(4, regionId);
			insert.setString(5, influence);
			insert.setInt(6, lastLogin);
			if (prevRegion != regionId && wasWA) {
				insert.setByte(7, (byte)(2));
			} else {
				insert.setByte(7, (byte)(waMember ? 1 : 0));
			}
			insert.setInt(8, id);
			insert.executeUpdate();
			DbUtils.closeQuietly(insert);
			return 0;
		}
	}
}
