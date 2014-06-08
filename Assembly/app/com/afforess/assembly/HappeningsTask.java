package com.afforess.assembly;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Matcher;

import org.apache.commons.dbutils.DbUtils;
import org.apache.commons.lang.WordUtils;
import org.apache.http.conn.HttpHostConnectException;
import org.joda.time.Duration;

import play.Logger;

import com.afforess.assembly.model.HappeningType;
import com.afforess.assembly.util.DatabaseAccess;
import com.afforess.assembly.util.Utils;
import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import com.limewoodMedia.nsapi.NationStates;
import com.limewoodMedia.nsapi.exceptions.RateLimitReachedException;
import com.limewoodMedia.nsapi.holders.HappeningData;
import com.limewoodMedia.nsapi.holders.HappeningData.EventHappening;
import com.mchange.v2.c3p0.ComboPooledDataSource;

public class HappeningsTask implements Runnable {
	private final NationStates api;
	private final ComboPooledDataSource pool;
	private final DatabaseAccess access;
	private int maxEventId = -1;
	private int newEvents = 0;
	private long lastRun = 0L;
	private int newEventSanityCounter = 0;
	private final Cache<Integer, Boolean> updateCache = CacheBuilder.newBuilder().maximumSize(250).expireAfterWrite(1, TimeUnit.MINUTES).build();
	/**
	 * A counter, when set > 0, runs happening update polls at 2s intervals, otherwise at 10s intervals.
	 */
	private final AtomicInteger highActivity = new AtomicInteger(1);
	private final HealthMonitor monitor;
	private final static Cache<String, Boolean> puppetCache = CacheBuilder.newBuilder().maximumSize(1000).expireAfterWrite(5, TimeUnit.MINUTES).build();
	public HappeningsTask(DatabaseAccess access, NationStates api, HealthMonitor health) {
		this.api = api;
		this.pool = access.getPool();
		this.access = access;
		this.monitor = health;
		Connection conn = null;
		PreparedStatement state = null;
		ResultSet result = null;
		try {
			conn = pool.getConnection();
			state = conn.prepareStatement("SELECT last_event_id FROM assembly.settings WHERE id = 1");
			result = state.executeQuery();
			result.next();
			maxEventId = result.getInt(1);
		} catch (SQLException e) {
			throw new RuntimeException(e);
		} finally {
			DbUtils.closeQuietly(result);
			DbUtils.closeQuietly(state);
			DbUtils.closeQuietly(conn);
		}
	}

	public boolean isHighActivity() {
		return highActivity.get() > 0;
	}

	public static void markNationAsPuppet(String nation) {
		puppetCache.put(nation, true);
	}

	public static boolean isPuppetNation(String nation) {
		return puppetCache.getIfPresent(nation) != null;
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
		try {
			runImpl();
		} catch (Exception e) {
			Logger.error("Exception processing happenings", e);
			highActivity.incrementAndGet();
		}
	}

	public void runImpl() {
		if (monitor != null) monitor.happeningHeartbeat();
		Logger.info("Starting Happenings Task: " + maxEventId);
		HappeningData data;
		synchronized (api) {
			//Throttle the happening queries based on how many new happenings occurred last run
			if (lastRun + Duration.standardSeconds(10).getMillis() > System.currentTimeMillis()) {
				final int activity = this.highActivity.get();
				if (newEvents >= 50 || activity > 0) {
					Logger.debug("Very high happenings activity, running at 2s intervals");
					this.highActivity.set(newEvents >= 50 ? 10 : activity - 1);
				} else {
					Logger.debug("Skipping happening run, little activity, last run was " + (System.currentTimeMillis() - lastRun) + " ms ago");
					return;
				}
			}
			lastRun = System.currentTimeMillis() + Duration.standardSeconds(1).getMillis();
			newEvents = 0;
			Logger.info("Executing global happenings run. Max Event ID: " + maxEventId);
			try {
				data = api.getHappeningInfo(null, -1, maxEventId);
			} catch (RateLimitReachedException e) {
				Logger.warn("Happenings monitoring rate limited!");
				return;
			} catch (RuntimeException e) {
				if (e.getCause() instanceof HttpHostConnectException) {
					//NS may be down or under high load
					Logger.warn("Happenings monitoring failed to connect to NationStates.net!", e.getCause());
					return;
				} else {
					Logger.error("Unhandled Exception monitoring happenings", e);
					return;
				}
			}
			final int oldEventId = maxEventId;
			for (EventHappening happening : data.happenings) {
				//Set the max id to the largest event id
				if (maxEventId < happening.eventId) {
					maxEventId = happening.eventId;
				}
				if (oldEventId < happening.eventId) {
					newEvents++;
				}
			}
			//Sanity check in case some genius decides to reset the event id sequence.
			if (newEvents == 0) {
				newEventSanityCounter++;
			} else {
				newEventSanityCounter = 0;
			}
			if (newEventSanityCounter > 60) {
				Logger.warn("HAPPENING EVENT IDS OUT OF SEQUENCE - RESETTING MAX EVENT ID!");
				maxEventId = 0;
			}
		}
		Connection conn = null;
		PreparedStatement happeningInsert = null;
		try {
			conn = pool.getConnection();
			
			PreparedStatement state = conn.prepareStatement("UPDATE assembly.settings SET last_event_id = ? WHERE id = 1");
			state.setInt(1, maxEventId);
			state.executeUpdate();
			DbUtils.closeQuietly(state);
			
			happeningInsert = conn.prepareStatement("INSERT INTO assembly.global_happenings (nation, happening, timestamp, type) VALUES (?, ?, ?, ?)", Statement.RETURN_GENERATED_KEYS);
			for (EventHappening happening : data.happenings) {
				final String text = happening.text;
				final long timestamp = happening.timestamp * 1000;
				Matcher match = Utils.NATION_PATTERN.matcher(text);
				int nationId = -1;
				String nation = "";
				if (match.find()) {
					String title = text.substring(match.start() + 2, match.end() - 2);
					nation = Utils.sanitizeName(title);
					nationId = access.getNationId(nation);
					if (nationId == -1) {
						PreparedStatement insert = conn.prepareStatement("INSERT INTO assembly.nation (name, title, full_name, region, first_seen, wa_member) VALUES (?, ?, ?, ?, ?, 2)", Statement.RETURN_GENERATED_KEYS);
						insert.setString(1, nation);
						insert.setString(2, title);
						insert.setString(3, WordUtils.capitalizeFully(nation.replaceAll("_", " ")));
						insert.setInt(4, -1);
						insert.setLong(5, happening.timestamp);
						insert.executeUpdate();
						ResultSet keys = insert.getGeneratedKeys();
						keys.next();
						nationId = keys.getInt(1);
						access.getNationIdCache().put(nation, nationId);
						
						DbUtils.closeQuietly(keys);
						DbUtils.closeQuietly(insert);
					}
				}

				final int happeningType = HappeningType.match(text);
				final HappeningType type = HappeningType.getType(happeningType);

				if (happeningType == HappeningType.getType("ENDORSEMENT").getId()) {
					if (match.find()) {
						String title = text.substring(match.start() + 2, match.end() - 2);
						String otherNation = Utils.sanitizeName(title);
						addEndorsement(conn, access.getNationId(otherNation), nationId);

						//Add *was endorsed by* to db
						happeningInsert.setInt(1, access.getNationIdCache().get(otherNation));
						happeningInsert.setString(2, "@@" + otherNation + "@@ was endorsed by @@" + nation + "@@.");
						happeningInsert.setLong(3, timestamp);
						happeningInsert.setInt(4, happeningType);
						happeningInsert.executeUpdate();
					}
				} else if (happeningType == HappeningType.getType("WITHDREW_ENDORSEMENT").getId()) {
					if (match.find()) {
						String title = text.substring(match.start() + 2, match.end() - 2);
						String otherNation = Utils.sanitizeName(title);
						removeEndorsement(conn, access.getNationIdCache().get(otherNation), nationId);
					}
				} else if (happeningType == HappeningType.getType("LOST_ENDORSEMENT").getId()) {
					if (match.find()) {
						String title = text.substring(match.start() + 2, match.end() - 2);
						String otherNation = Utils.sanitizeName(title);
						removeEndorsement(conn, nationId, access.getNationIdCache().get(otherNation));
					}
				} else if (happeningType == HappeningType.getType("RESIGNED_FROM_WORLD_ASSEMBLY").getId()) {
					resignFromWorldAssembly(conn, nationId, false);
				} else if (happeningType == HappeningType.getType("ADMITTED_TO_WORLD_ASSEMBLY").getId()) {
					joinWorldAssembly(conn, nationId);
				} else if (happeningType == HappeningType.getType("EJECTED_FOR_RULE_VIOLATIONS").getId()) {
					resignFromWorldAssembly(conn, nationId, true);
				} else if (happeningType == HappeningType.getType("ABOLISHED_REGIONAL_FLAG").getId()) {
					abolishRegionFlag(conn, access, text);
				} else if (happeningType == HappeningType.getType("RELOCATED").getId()) {
					relocateNation(conn, nationId, nation, text);
				} else if (updateCache.getIfPresent(nationId) == null && happeningType == HappeningType.getType("NEW_LEGISLATION").getId()) {
					setRegionUpdateTime(conn, nationId, timestamp);
					updateCache.put(nationId, true);
				} else if (nationId > -1 && (happeningType == HappeningType.getType("REFOUNDED").getId() || happeningType == HappeningType.getType("FOUNDED").getId())) {
					if (happeningType == HappeningType.getType("REFOUNDED").getId()) {
						//Ensure nation is dead
						access.markNationDead(nationId, conn);
						
						//Only erase flag if it was user uploaded
						PreparedStatement flag = conn.prepareStatement("SELECT flag FROM assembly.nation WHERE id = ?");
						flag.setInt(1, nationId);
						ResultSet set = flag.executeQuery();
						boolean eraseFlag = set.next() && set.getString(1).contains("/uploads/");
						DbUtils.closeQuietly(set);
						DbUtils.closeQuietly(flag);
						
						PreparedStatement alive = conn.prepareStatement("UPDATE assembly.nation SET alive = 1, wa_member = 2" + (eraseFlag ? ", flag = ?" : "") + " WHERE id = ?");
						if (eraseFlag) {
							alive.setString(1, "//nationstates.net/images/flags/Default.png");
							alive.setInt(2, nationId);
						} else {
							alive.setInt(1, nationId);
						}
						alive.executeUpdate();
						DbUtils.closeQuietly(alive);
					}

					//Update region
					Matcher regions = Utils.REGION_PATTERN.matcher(text);
					if(regions.find()) {
						final int regionId = access.getRegionId(text.substring(regions.start() + 2, regions.end() - 2));
						if (regionId > -1) {					
							PreparedStatement update = conn.prepareStatement("UPDATE assembly.nation SET region = ?, wa_member = 2, puppet = ? WHERE id = ?");
							update.setInt(1, regionId);
							update.setInt(2, puppetCache.getIfPresent(nation) != null ? 1 : 0);
							update.setInt(3, nationId);
							update.executeUpdate();
							DbUtils.closeQuietly(update);
							
							if (puppetCache.getIfPresent(nation) != null) {
								String defaultSettings = "{\"settings\":{\"show_gameplay_news\":false,\"show_roleplay_news\":false,\"show_regional_news\":false,\"show_irc\":false,\"show_world_census\":false,\"show_regional_population\":false,},\"last_update\":" + System.currentTimeMillis() + "}";
								PreparedStatement insert = conn.prepareStatement("INSERT INTO assembly.ns_settings (id, settings, last_settings_update) VALUES (?, ?, ?)");
								insert.setInt(1, nationId);
								insert.setString(2, defaultSettings);
								insert.setLong(3, System.currentTimeMillis());
								insert.executeUpdate();
								DbUtils.closeQuietly(insert);
								puppetCache.invalidate(nation);
							}
						}
					}
				} else if (nationId > -1 && happeningType == HappeningType.getType("CEASED_TO_EXIST").getId()) {
					access.markNationDead(nationId, conn);
				}
				happeningInsert.setInt(1, nationId);
				happeningInsert.setString(2, parseHappening(text));
				happeningInsert.setLong(3, timestamp);
				happeningInsert.setInt(4, happeningType);
				happeningInsert.executeUpdate();
				ResultSet keys = happeningInsert.getGeneratedKeys();
				keys.next();
				int happeningId = keys.getInt(1);
				if (type != null) {
					updateRegionHappenings(conn, access, nationId, happeningId, text, type);
				}
				DbUtils.closeQuietly(keys);
			}
		} catch (SQLException e) {
			Logger.error("Unable to update happenings", e);
		}  catch (ExecutionException e) {
			Logger.error("Unable to update happenings", e);
		} finally {
			DbUtils.closeQuietly(happeningInsert);
			DbUtils.closeQuietly(conn);
		}
	}

	public static void abolishRegionFlag(Connection conn, DatabaseAccess access, String happening) throws SQLException, ExecutionException {
		Matcher regions = Utils.REGION_PATTERN.matcher(happening);
		if (regions.find()) {
			int region = access.getRegionId(happening.substring(regions.start() + 2, regions.end() - 2));
			if (region > -1) {
				PreparedStatement updateFlag = conn.prepareStatement("UPDATE assembly.region SET flag = ? WHERE id = ?");
				updateFlag.setString(1, "");
				updateFlag.setInt(2, region);
				updateFlag.executeUpdate();
				DbUtils.closeQuietly(updateFlag);
			}
		}
	}

	public static void updateRegionHappenings(Connection conn, DatabaseAccess access, int nationId, int happeningId, String happening, HappeningType type) throws SQLException, ExecutionException {
		String region1Happening = type.transformToRegion1Happening(happening);
		String region2Happening = type.transformToRegion2Happening(happening);
		List<Integer> regionIds = new ArrayList<Integer>(2);
		Matcher regions = Utils.REGION_PATTERN.matcher(happening);
		while(regions.find()) {
			regionIds.add(access.getRegionId(happening.substring(regions.start() + 2, regions.end() - 2)));
		}
		if (regionIds.size() == 0 && nationId > -1) {
			PreparedStatement select = conn.prepareStatement("SELECT region FROM assembly.nation WHERE id = ?");
			select.setInt(1, nationId);
			ResultSet result = select.executeQuery();
			if (result.next()) {
				regionIds.add(result.getInt(1));
			}
			DbUtils.closeQuietly(result);
			DbUtils.closeQuietly(select);
		}
		PreparedStatement insert = conn.prepareStatement("INSERT INTO assembly.regional_happenings (global_id, region, happening) VALUES (?, ?, ?)");
		if (region1Happening != null && regionIds.size() > 0) {
			insert.setInt(1, happeningId);
			insert.setInt(2, regionIds.get(0));
			insert.setString(3, region1Happening);
			insert.executeUpdate();
		}
		if (region2Happening != null && regionIds.size() > 1) {
			insert.setInt(1, happeningId);
			insert.setInt(2, regionIds.get(1));
			insert.setString(3, region2Happening);
			insert.executeUpdate();
		}
		DbUtils.closeQuietly(insert);
	}

	private synchronized void setRegionUpdateTime(Connection conn, int nationId, long timestamp) throws SQLException {
		final int region = getRegionOfNation(conn, nationId);
		if (region != -1) {
			PreparedStatement select = null, update = null, insert = null;
			ResultSet result = null;
			try {
				select = conn.prepareStatement("SELECT id, start, end FROM assembly.region_updates WHERE region = ? AND start BETWEEN ? AND ?");
				select.setInt(1, region);
				select.setLong(2, timestamp - Duration.standardHours(1).getMillis());
				select.setLong(3, timestamp + Duration.standardHours(1).getMillis());
				result = select.executeQuery();
				if (result.next()) {
					final int id = result.getInt(1);
					final long start = result.getLong(2);
					final long end = result.getLong(3);
					update = conn.prepareStatement("UPDATE assembly.region_updates SET start = ?, end = ? WHERE id = ?");
					update.setLong(1, Math.min(start, timestamp));
					update.setLong(2, Math.max(end, timestamp));
					update.setInt(3, id);
					update.executeUpdate();
				} else {
					insert = conn.prepareStatement("INSERT INTO assembly.region_updates (region, start, end) VALUES (?, ?, ?)");
					insert.setLong(1, region);
					insert.setLong(2, timestamp);
					insert.setLong(3, timestamp);
					insert.executeUpdate();
				}
			} finally {
				DbUtils.closeQuietly(result);
				DbUtils.closeQuietly(insert);
				DbUtils.closeQuietly(update);
				DbUtils.closeQuietly(select);
			}
		} else {
			Logger.info("Can not set region update time for nation [" + nationId + "], unknown region!");
		}
	}

	private int getRegionOfNation(Connection conn, int nationId) throws SQLException {
		PreparedStatement select = null;
		ResultSet result = null;
		try {
			select = conn.prepareStatement("SELECT region FROM assembly.nation WHERE id = ?");
			select.setInt(1, nationId);
			result = select.executeQuery();
			if (result.next()) {
				return result.getInt(1);
			}
			return -1;
		} finally {
			DbUtils.closeQuietly(result);
			DbUtils.closeQuietly(select);
		}
	}

	private void relocateNation(Connection conn, int nationId, String nation, String happening) throws SQLException {
		Matcher match = Utils.REGION_PATTERN.matcher(happening);
		String prevRegion = null;
		String newRegion = null;
		if (match.find()) {
			String title = happening.substring(match.start() + 2, match.end() - 2);
			prevRegion = Utils.sanitizeName(title);
		}
		if (match.find()) {
			String title = happening.substring(match.start() + 2, match.end() - 2);
			newRegion = Utils.sanitizeName(title);
		}
		Logger.debug("Relocating " + nation + " from " + prevRegion + " to " + newRegion);
		if (prevRegion != null && newRegion != null) {
			//Double check they are still at their prev region before setting their new region!
			int newRegionId = getOrCreateRegion(conn, nation, newRegion);
			PreparedStatement update = conn.prepareStatement("UPDATE assembly.nation SET region = ?, wa_member = 2 WHERE id = ? AND region = ?");
			update.setInt(1, newRegionId);
			update.setInt(2, nationId);
			update.setInt(3, getOrCreateRegion(conn, nation, prevRegion));
			update.executeUpdate();
			DbUtils.closeQuietly(update);
		}
	}

	private int getOrCreateRegion(Connection conn, String nation, String region) throws SQLException {
		PreparedStatement select = null;
		ResultSet result = null;
		try {
			select = conn.prepareStatement("SELECT id FROM assembly.region WHERE name = ?");
			select.setString(1, region);
			result = select.executeQuery();
			if (result.next()) {
				return result.getInt(1);
			}
			PreparedStatement insert = null;
			ResultSet keys = null;
			try {
				insert = conn.prepareStatement("INSERT INTO assembly.region (name, flag, founder, title) VALUES (?, ?, ?, ?)", Statement.RETURN_GENERATED_KEYS);
				insert.setString(1, region);
				insert.setString(2, "");
				insert.setString(3, nation);
				insert.setString(4, Utils.formatName(region));
				insert.executeUpdate();
				keys = insert.getGeneratedKeys();
				keys.next();
				int id = keys.getInt(1);
				access.getRegionIdCache().put(region, id);
				return id;
			} finally {
				DbUtils.closeQuietly(keys);
				DbUtils.closeQuietly(insert);
			}
		} finally {
			DbUtils.closeQuietly(result);
			DbUtils.closeQuietly(select);
		}
	}

	private void addEndorsement(Connection conn, int endorsed, int endorser) throws SQLException {
		PreparedStatement selectDuplicates = conn.prepareStatement("SELECT endorsed FROM assembly.endorsements WHERE endorsed = ? AND endorser = ?");
		selectDuplicates.setInt(1, endorsed);
		selectDuplicates.setInt(2, endorser);
		if (!selectDuplicates.executeQuery().next()) {
			PreparedStatement endorsements = conn.prepareStatement("INSERT INTO assembly.endorsements (endorser, endorsed) VALUES (?, ?)");
			endorsements.setInt(1, endorser);
			endorsements.setInt(2, endorsed);
			endorsements.executeUpdate();
			DbUtils.closeQuietly(endorsements);
		}
		DbUtils.closeQuietly(selectDuplicates);
	}

	private void removeEndorsement(Connection conn, int endorsed, int endorser) throws SQLException {
		PreparedStatement endorsements = conn.prepareStatement("DELETE FROM assembly.endorsements WHERE endorsed = ? AND endorser = ?");
		endorsements.setInt(1, endorsed);
		endorsements.setInt(2, endorser);
		endorsements.executeUpdate();
		DbUtils.closeQuietly(endorsements);
	}

	private void resignFromWorldAssembly(Connection conn, int nationId, boolean banned) throws SQLException {
		PreparedStatement endorsements = conn.prepareStatement("UPDATE assembly.nation SET wa_member = " + (banned ? "0" : "2") + " WHERE id = ?");
		endorsements.setInt(1, nationId);
		endorsements.executeUpdate();
		DbUtils.closeQuietly(endorsements);
	}

	private void joinWorldAssembly(Connection conn, int nationId) throws SQLException {
		PreparedStatement endorsements = conn.prepareStatement("UPDATE assembly.nation SET wa_member = 1 WHERE id = ?");
		endorsements.setInt(1, nationId);
		endorsements.executeUpdate();
		DbUtils.closeQuietly(endorsements);
	}
}
