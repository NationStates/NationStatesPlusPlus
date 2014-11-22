package net.nationstatesplusplus.assembly;

import java.io.File;
import java.io.FileNotFoundException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import net.nationstatesplusplus.assembly.util.DatabaseAccess;
import net.nationstatesplusplus.assembly.util.Utils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.afforess.nsdump.NationsDump;
import com.afforess.nsdump.RegionsDump;
import com.google.common.collect.Lists;
import com.mchange.v2.c3p0.ComboPooledDataSource;

/**
 * A runnable that updates the state of nations based on the given region and nation dumps
 */
public class DumpUpdateTask implements Runnable {
	private static final Logger logger = LoggerFactory.getLogger(DumpUpdateTask.class);
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
			logger.info("Starting daily dumps update task with [{}] & [{}]", regionDump.getName(), nationDump.getName());
			RegionsDump regions = new RegionsDump(regionDump);
			regions.parse();
			updateRegions(regions);
			
			NationsDump nations = new NationsDump(nationDump);
			nations.parse();
			updateNations(nations);
			
			logger.info("Finished daily dumps update task");
		} catch (FileNotFoundException e) {
			throw new RuntimeException(e);
		}
	}

	/**
	 * Connects to the h2 database created from the region dump and updates existing region
	 * information from the dump. New regions are added and old regions are marked as dead.
	 * 
	 * @param dump
	 */
	private void updateRegions(RegionsDump dump) {
		try (Connection h2Conn = dump.getDatabaseConnection()) {
			final Set<String> dumpRegions = new HashSet<String>(20000);
			try (PreparedStatement statement = h2Conn.prepareStatement("SELECT name FROM regions")) {
				try (ResultSet result = statement.executeQuery()) {
					while (result.next()) {
						dumpRegions.add(result.getString(1));
					}
				}
			}
			logger.info("Updating {} regions from daily dump", dumpRegions.size());
			int newRegions = 0;

			List<List<String>> regionLists = Lists.partition(new ArrayList<String>(dumpRegions), 1000);
			for (List<String> regions : regionLists) {
				try (Connection conn = pool.getConnection()) {
					try (PreparedStatement select = h2Conn.prepareStatement("SELECT title, flag, delegate, founder, numnations, update_order, embassies FROM regions WHERE name = ?")) {
						for (String region : regions) {
							select.setString(1, region);
							try (ResultSet result = select.executeQuery()) {
								result.next();
								newRegions += updateRegion(conn, region, result.getString(1), result.getString(2), result.getString(3), result.getString(4), result.getInt(5), result.getInt(6), result.getString(7));
							}
						}
					}
				}
			}
			logger.info("Added {} regions to the database", newRegions);
			Set<String> allRegions = new HashSet<String>(20000);
			try (Connection conn = pool.getConnection()) {
				try (PreparedStatement select = conn.prepareStatement("SELECT name FROM assembly.region WHERE alive = 1")) {
					try (ResultSet result = select.executeQuery()) {
						while (result.next()) {
							allRegions.add(result.getString(1));
						}
					}
				}
			}
			allRegions.removeAll(dumpRegions);
			logger.info("Marking {} regions as dead", allRegions.size());
			try (Connection conn = pool.getConnection()) {
				for (String region : allRegions) {
					access.markRegionDead(region, conn);
				}
			}
			h2Conn.prepareStatement("DROP TABLE regions").execute();
			h2Conn.prepareStatement("SHUTDOWN COMPACT").execute();
		} catch (Exception e) {
			logger.error("unable to update region dumps", e);
		}
	}

	/**
	 * Updates an individual region with the fields from the region dump, or inserts a new region
	 * 
	 * @param conn 
	 * @param region
	 * @param title
	 * @param flag
	 * @param delegate
	 * @param founder
	 * @param numNations
	 * @param updateOrder
	 * @param embassies
	 * @return 1 if a new region was inserted or 0 if a region was updated
	 * @throws SQLException
	 */
	private int updateRegion(Connection conn, String region, String title, String flag, String delegate, String founder, int numNations, int updateOrder, String embassies) throws SQLException {
		int regionId = -1;
		try (PreparedStatement select = conn.prepareStatement("SELECT id FROM assembly.region WHERE name = ?")) {
			select.setString(1, region);
			try (ResultSet result = select.executeQuery()) {
				if (result.next()) {
					regionId = result.getInt(1);
				}
			}
		}

		logger.debug("Updating region [{}] from the daily dump [numnations: {}]", region, numNations);
		try (PreparedStatement insert = conn.prepareStatement("INSERT INTO assembly.region_populations (region, population, timestamp) VALUES (?, ?, ?)")) {
			insert.setString(1, region);
			insert.setInt(2, numNations);
			insert.setLong(3, System.currentTimeMillis());
			insert.executeUpdate();
		}

		if (flag.startsWith("http://")) {
			flag = "//" + flag.substring(7);
		}

		if (regionId == -1) {
			try (PreparedStatement insert = conn.prepareStatement("INSERT INTO assembly.region (name, title, flag, delegate, founder, alive, population, update_order, embassies) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)")) {
				insert.setString(1, region);
				insert.setString(2, title);
				insert.setString(3, flag);
				insert.setString(4, delegate);
				insert.setString(5, founder);
				insert.setInt(6, numNations);
				insert.setInt(7, updateOrder);
				if (embassies != null && embassies.trim().length() > 0)
					insert.setString(8, embassies);
				else
					insert.setNull(8, Types.CLOB);
				insert.executeUpdate();
			}
			return 1;
		} else {
			try (PreparedStatement update = conn.prepareStatement("UPDATE assembly.region SET alive = 1, title = ?, flag = ?, delegate = ?, founder = ?, population = ?, update_order = ?, embassies = ? WHERE id = ?")) {
				update.setString(1, title);
				update.setString(2, flag);
				update.setString(3, delegate);
				update.setString(4, founder);
				update.setInt(5, numNations);
				update.setInt(6, updateOrder);
				if (embassies != null && embassies.trim().length() > 0)
					update.setString(7, embassies);
				else
					update.setNull(7, Types.CLOB);
				update.setInt(8, regionId);
				update.executeUpdate();
			}
			return 0;
		}
	}

	/**
	 * An array of nation fields that map directly from the nation dump to the sql table field names
	 */
	private static String[] NATION_FIELDS = new String[] {"motto", "currency", "animal", "capital", "leader", "religion", "category", "civilrights", "economy",
	                                "politicalfreedom", "population", "tax", "majorindustry", "governmentpriority", "environment", "socialequality",
	                                "education", "lawandorder", "administration", "welfare", "spirituality", "defence",	"publictransport",
	                                "healthcare", "commerce", "civilrightscore", "economyscore", "politicalfreedomscore", "publicsector"};

	/**
	 * Updates nations from the h2 database created from the nation dump file. New nations are inserted,
	 * Nations which are missing are marked as dead, and existing nations are updated.
	 * 
	 * @param dump
	 */
	private void updateNations(NationsDump dump) {
		try (Connection h2Conn = dump.getDatabaseConnection()) {
			final HashSet<String> set = new HashSet<String>(150000);
			
			try (PreparedStatement statement = h2Conn.prepareStatement("SELECT name FROM nations")) {
				try (ResultSet result = statement.executeQuery()) {
					while (result.next()) {
						set.add(result.getString(1));
					}
				}
			}
			
			logger.info("Updating {} nations from daily dump", set.size());
			int newNations = 0;

			List<List<String>> nationLists = Lists.partition(new ArrayList<String>(set), 1000);
			for (List<String> nations : nationLists) {
				try (Connection conn = pool.getConnection()) {
					try (PreparedStatement select = h2Conn.prepareStatement("SELECT title, fullname, unstatus, influence, lastlogin, flag, region, motto," +
							"currency, animal, capital, leader, religion, category, civilrights, economy, politicalfreedom, population, tax, majorindustry," + 
							"governmentpriority, environment, socialequality, education, lawandorder, administration, welfare, spirituality, defence," +
							"publictransport, healthcare, commerce, civilrightscore, economyscore, politicalfreedomscore, publicsector FROM nations WHERE name = ?")) {
					
						Map<String, Integer> columnMapping = null;
						
						for (String nation : nations) {
							select.setString(1, nation);
							try (ResultSet result = select.executeQuery()) {
								result.next();
								//These are the legacy fields that don't map directly to nationstate dump field names
								newNations += updateNation(conn, nation, result.getString("title"), result.getString("fullname"), !result.getString("unstatus").toLowerCase().equals("non-member"),
										result.getString("influence"), result.getInt("lastlogin"), result.getString("flag"), result.getString("region"));
								
								//Cache the column name -> column index mapping
								ResultSetMetaData metaData = result.getMetaData();
								if (columnMapping == null) {
									int columns = metaData.getColumnCount();
									columnMapping = new HashMap<String, Integer>();
									for (int i = 1; i <= columns; i++) {
										columnMapping.put(metaData.getColumnName(i).toLowerCase(), i);
									}
								}
								
								//Note: this sql works because the nation will always exist after updateNation above runs
								//If that behavior changes, this will have to be changed too
								//update extra nation fields, build sql with field names
								StringBuilder fields = new StringBuilder("UPDATE assembly.nation SET ");
								for (int i = 0; i < NATION_FIELDS.length; i++) {
									fields.append(NATION_FIELDS[i]).append(" = ?");
									if (i != NATION_FIELDS.length - 1) fields.append(", ");
								}
								//Add search clause
								fields.append(" WHERE name = ?");
								logger.trace("Update fields sql statement: {}", fields);
								try (PreparedStatement updateFields = conn.prepareStatement(fields.toString())) {
									for (int i = 0; i < NATION_FIELDS.length; i++) {
										updateFields.setObject(i + 1, result.getObject(columnMapping.get(NATION_FIELDS[i])), metaData.getColumnType(columnMapping.get(NATION_FIELDS[i])));
									}
									updateFields.setString(NATION_FIELDS.length + 1, nation);
									updateFields.executeUpdate();
								}
							}
						}
					}
				}
			}
			logger.info("Added {} nations to the database", newNations);

			final Set<String> allNations;
			try (Connection conn = pool.getConnection()) {
				allNations = new HashSet<String>(150000);
				try (PreparedStatement select = conn.prepareStatement("SELECT name FROM assembly.nation WHERE alive = 1")) {
					try (ResultSet result = select.executeQuery() ){
						while (result.next()) {
							allNations.add(result.getString(1));
						}
					}
				}
			}
			try (Connection conn = pool.getConnection()) {
				allNations.removeAll(set);
				logger.info("Marking " + allNations.size() + " nations as dead");
				for (String nation : allNations) {
					access.markNationDead(nation, conn);
				}
			}
			h2Conn.prepareStatement("DROP TABLE nations").execute();
			h2Conn.prepareStatement("SHUTDOWN COMPACT").execute();
			try (Connection conn = pool.getConnection()) {
				int cleanupNations = 0;
				try (PreparedStatement deadWAMembers = conn.prepareStatement("SELECT id FROM assembly.nation WHERE alive = 0 AND wa_member = 1")) {
					try (ResultSet result = deadWAMembers.executeQuery()) {
						while(result.next()) {
							access.markNationDead(result.getInt(1), conn);
							cleanupNations++;
						}
					}
				}
				logger.info("Cleaned up {} who were dead World Assembly Member nations!", cleanupNations);
			}
		} catch (SQLException e) {
			logger.error("unable to update nation dumps", e);
		}
	}

	/**
	 * Updates an individual nations name, title, wa membership status, influence, last login, flag and region
	 * 
	 * @param conn
	 * @param nation
	 * @param title
	 * @param fullName
	 * @param waMember
	 * @param influence
	 * @param lastLogin
	 * @param flag
	 * @param region
	 * @return 1 if a new nation was inserted, 0 if a nation was updated
	 * @throws SQLException
	 */
	private int updateNation(Connection conn, String nation, String title, String fullName,  boolean waMember, String influence, int lastLogin, String flag, String region) throws SQLException {
		int id = -1;
		int prevRegion = -1;
		boolean wasWA = false;
		try (PreparedStatement select = conn.prepareStatement("SELECT id, wa_member, region FROM assembly.nation WHERE name = ?")) {
			select.setString(1, nation);
			try (ResultSet result = select.executeQuery()) {
				if (result.next()) {
					id = result.getInt(1);
					wasWA = result.getBoolean(2);
					prevRegion = result.getInt(3);
				}
			}
		}
		
		int regionId = -1;
		try (PreparedStatement select = conn.prepareStatement("SELECT id FROM assembly.region WHERE name = ?")) {
			select.setString(1, Utils.sanitizeName(region));
			try (ResultSet result = select.executeQuery()) {
				if (result.next()) {
					regionId = result.getInt(1);
				}
			}
		}
		
		if (flag.startsWith("http://")) {
			flag = "//" + flag.substring(7);
		}
		
		logger.debug("Updating nation [{}] from the daily dump", nation);
		if (id == -1) {
			try (PreparedStatement insert = conn.prepareStatement("INSERT INTO assembly.nation (name, title, full_name, flag, region, influence_desc, last_login, wa_member, alive, first_seen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")) {
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
			}
			return 1;
		} else {
			try (PreparedStatement update = conn.prepareStatement("UPDATE assembly.nation SET alive = 1, full_name = ?, title = ?, flag = ?, region = ?, influence_desc = ?, last_login = ?, wa_member = ? WHERE id = ?")) {
				update.setString(1, fullName);
				update.setString(2, title);
				update.setString(3, flag);
				update.setInt(4, regionId);
				update.setString(5, influence);
				update.setInt(6, lastLogin);
				//A note about wa-members
				//wa_member = 0 is for non-members
				//wa_member = 1 is for wa-members
				//wa_member = 2 is for wa-members who recently moved
				//When a WA member moves region, they do not immediately lose their endorsements
				//I blame Max for this funky behavior
				if (prevRegion != regionId && wasWA) {
					update.setByte(7, (byte)(2));
				} else {
					update.setByte(7, (byte)(waMember ? 1 : 0));
				}
				update.setInt(8, id);
				update.executeUpdate();
			}
			return 0;
		}
	}
}
