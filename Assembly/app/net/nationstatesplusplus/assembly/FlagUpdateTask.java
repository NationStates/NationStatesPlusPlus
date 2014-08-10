package net.nationstatesplusplus.assembly;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Iterator;
import java.util.LinkedHashSet;

import net.nationstatesplusplus.assembly.util.DatabaseAccess;
import net.nationstatesplusplus.assembly.util.Utils;

import org.joda.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.limewoodMedia.nsapi.NationStates;
import com.limewoodMedia.nsapi.exceptions.RateLimitReachedException;
import com.limewoodMedia.nsapi.exceptions.UnknownRegionException;
import com.limewoodMedia.nsapi.holders.RegionData;

/**
 * Updates the flag urls in the database for nations and regions who have recently changed their flags
 */
public class FlagUpdateTask implements Runnable {
	private static final Logger logger = LoggerFactory.getLogger(FlagUpdateTask.class);
	private final NationStates api;
	private final DatabaseAccess access;
	private LinkedHashSet<Integer> regionsToUpdate = new LinkedHashSet<Integer>();
	private LinkedHashSet<Integer> nationsToUpdate = new LinkedHashSet<Integer>();
	public FlagUpdateTask(NationStates api, DatabaseAccess access) {
		this.api = api;
		this.access = access;
	}

	@Override
	public void run() {
		try (Connection conn = access.getPool().getConnection()) {
			updateFlagQueues(conn);

			logger.debug("{} Region Flag Updates Pending", regionsToUpdate.size());
			updateRegionFlags(conn, 2);

			logger.debug("{} Nation Flag Updates Pending", nationsToUpdate.size());
			updateNationFlags(conn, 2);
		} catch (RateLimitReachedException e) {
			logger.warn("Flag update task rate limited!");
		} catch (SQLException e) {
			logger.error("Unable to execute flag update task", e);
		}
	}

	private void updateRegionFlags(Connection conn, int amount) throws SQLException {
		Iterator<Integer> iter = regionsToUpdate.iterator();
		for (int i = 0; i < amount && iter.hasNext(); i++) {
			final int region = iter.next();
			try (PreparedStatement select = conn.prepareStatement("SELECT name FROM assembly.region WHERE id = ?")) {
				select.setInt(1, region);
				try (ResultSet result = select.executeQuery()) {
					if (result.next()) {
						String name = result.getString(1);
						try {
							//Update other fields because we are greedy and the NS api rate limits so heavily
							RegionData data = api.getRegionInfo(name, RegionData.Shards.FLAG, RegionData.Shards.NUM_NATIONS, RegionData.Shards.DELEGATE, RegionData.Shards.FOUNDER);
							String flag = data.flagURL != null ? data.flagURL : "";
							if (flag.startsWith("http://")) {
								flag = "//" + flag.substring(7);
							}
							try (PreparedStatement updateFlag = conn.prepareStatement("UPDATE assembly.region SET flag = ?, population = ?, delegate = ?, founder = ? WHERE id = ?")) {
								updateFlag.setString(1, flag);
								updateFlag.setInt(2, data.numNations);
								updateFlag.setString(3, data.delegate);
								updateFlag.setString(4, data.founder);
								updateFlag.setInt(5, region);
								updateFlag.executeUpdate();
							}
							logger.info("Updated region [" + name + "].");
						} catch (UnknownRegionException e) {
							access.markRegionDead(name, conn);
						}
					}
				}
			}
			iter.remove();
		}
	}

	private void updateNationFlags(Connection conn, int amount) throws SQLException {
		Iterator<Integer> iter = nationsToUpdate.iterator();
		for (int i = 0; i < amount && iter.hasNext(); i++) {
			final int nation = iter.next();
			try (PreparedStatement select = conn.prepareStatement("SELECT name FROM assembly.nation WHERE id = ?")) {
				select.setInt(1, nation);
				try (ResultSet result = select.executeQuery()) {
					if (result.next()) {
						String name = result.getString(1);
						Utils.updateNation(conn, access, api, name, nation);
					}
				}
			}
			iter.remove();
		}
	}

	/**
	 * Checks the region and nation global happenings for changes to region and national flags and adds them to the queue to be updated
	 * @param conn
	 * @throws SQLException
	 */
	private void updateFlagQueues(Connection conn) throws SQLException {
		final long time = System.currentTimeMillis() - Duration.standardMinutes(2).getMillis();
		try (PreparedStatement select = conn.prepareStatement("SELECT r.region FROM (assembly.global_happenings AS g LEFT JOIN assembly.regional_happenings AS r ON g.id = r.global_id) WHERE g.type = 41 AND g.timestamp > ? GROUP by g.nation ORDER BY g.timestamp ASC")) {
			select.setLong(1, time);
			try (ResultSet result = select.executeQuery()) {
				while(result.next()) {
					regionsToUpdate.add(result.getInt(1));
				}
			}
		}

		//These are brand new regions not created from the daily dumps (or else their population would be non-zero)
		try (PreparedStatement select = conn.prepareStatement("SELECT id FROM assembly.region WHERE alive = 1 AND population = 0 LIMIT 0, 100")) {
			try (ResultSet result = select.executeQuery()) {
				while(result.next()) {
					regionsToUpdate.add(result.getInt(1));
				}
			}
		}

		try (PreparedStatement select = conn.prepareStatement("SELECT nation FROM assembly.global_happenings WHERE type = 7 AND timestamp > ? ORDER BY timestamp ASC")) {
			select.setLong(1, time);
			try (ResultSet result = select.executeQuery()) {
				while(result.next()) {
					nationsToUpdate.add(result.getInt(1));
				}
			}
		}
	}
}
