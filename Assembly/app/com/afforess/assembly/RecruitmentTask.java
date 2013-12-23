package com.afforess.assembly;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;
import java.util.regex.Pattern;

import org.apache.commons.dbutils.DbUtils;
import org.joda.time.Duration;

import play.Logger;

import com.afforess.assembly.model.RecruitmentAction;
import com.afforess.assembly.model.RecruitmentType;
import com.afforess.assembly.util.DatabaseAccess;
import com.limewoodMedia.nsapi.NationStates;

public class RecruitmentTask implements Runnable {
	private static final String[] FEEDER_REGIONS = {"the_north_pacific", "the_pacific", "the_east_pacific", "the_west_pacific", "the_south_pacific", "the_rejected_realms", "lazarus", "osiris", "balder"};
	private static final Pattern[] PENALTY_NAMES;
	static {
		String[] regex = {"nazi", "[0-9]", "puppet", "dead", "fag", "test", "spam", "switcher", "piss", "moderator"};
		PENALTY_NAMES = new Pattern[regex.length];
		for (int i = 0; i < regex.length; i++) {
			PENALTY_NAMES[i] = Pattern.compile(regex[i]);
		}
	}
	private final DatabaseAccess access;
	private final NationStates telegramAPI = new NationStates();
	public RecruitmentTask(DatabaseAccess access) {
		this.access = access;
		telegramAPI.setRateLimit(40);
		telegramAPI.setUserAgent("-- NationStates++ Recruitment Server --");
		telegramAPI.setRelaxed(true);
		telegramAPI.setProxyIP("162.243.18.166");
		telegramAPI.setProxyPort(3128);
	}

	@Override
	public void run() {
		try {
			runImpl();
		} catch (Exception e) {
			Logger.error("Exception processing recruitment", e);
		}
	}

	public void runImpl() throws SQLException {
		Connection conn = null;
		try {
			Random rand = new Random();
			conn = access.getPool().getConnection();
			HashSet<Integer> completedRegions = new HashSet<Integer>();
			List<RecruitmentAction> actions = RecruitmentAction.getAllActions(conn);
			for (RecruitmentAction action : actions) {
				if (action.error != 1 && action.lastAction < System.currentTimeMillis() && !completedRegions.contains(action.region) && rand.nextInt(100) < action.percent) {
					if (telegramAPI.getRateLimitRemaining() > 1) {
						Object[] nation = findTargetNation(action, conn);
						if (nation != null) {
							doRecruitment(action, completedRegions, nation, conn);
						}
					}
				}
			}
		} finally {
			DbUtils.closeQuietly(conn);
		}
	}

	private void doRecruitment(RecruitmentAction action, Set<Integer> completedRegions, Object[] nation, Connection conn) throws SQLException {
		PreparedStatement update = null;
		try {
			if (telegramAPI.sendTelegram(action.clientKey, action.secretKey, action.tgid, (String)nation[0]) != null) {
				completedRegions.add(action.region);
				final long lastAction = System.currentTimeMillis() + Duration.standardSeconds(180).getMillis();
				action.error = 0;
				action.lastAction = lastAction;
				action.update(conn);

				List<RecruitmentAction> regionTgs = RecruitmentAction.getActions(action.region, conn);
				for (RecruitmentAction telegram : regionTgs) {
					telegram.lastAction = lastAction;
					telegram.update(conn);
				}
				
				update = conn.prepareStatement("INSERT INTO assembly.recruitment_history (region, nation_id, tgid) VALUES (?, ?, ?)");
				update.setInt(1, action.region);
				update.setInt(2, (Integer)nation[1]);
				update.setString(3, action.tgid);
				update.executeUpdate();
			}
		} catch (RuntimeException e) {
			if (e.getCause() instanceof IOException) {
				IOException io = (IOException)e.getCause();
				if (io.getMessage().toLowerCase().contains("http response code: 429")) {
					action.lastAction = System.currentTimeMillis() + Duration.standardMinutes(15).getMillis();
					action.error = 2; //rate limited
					action.update(conn);
				} else if (io.getMessage().toLowerCase().contains("http response code: 403")) {
					action.error = 1; //invalid telegram or client key
					action.update(conn);
				} else if (io.getMessage().toLowerCase().contains("http response code: 400")) {
					action.error = 1; //invalid telegram or client key
					action.update(conn);
				} else {
					throw e;
				}
			} else {
				throw e;
			}
		} finally {
			DbUtils.closeQuietly(update);
		}
	}

	private String getTable(RecruitmentType type) {
		if (type == RecruitmentType.EJECTED_NATIONS) {
			return "assembly.ejected_nations";
		}
		if (type == RecruitmentType.REFOUNDED_NATIONS) {
			return "assembly.refounded_nations";
		}
		return "assembly.founded_nations";
	}

	private Object[] findTargetNation(RecruitmentAction action, Connection conn) throws SQLException {
		PreparedStatement newNations = null;
		ResultSet result = null;
		try {
			//TODO: improve randomize to not suck
			//newNations = conn.prepareStatement((action.randomize ? "SELECT * FROM ( " : "") + "SELECT nation, name, region_name FROM " + getTable(action.type) + " LIMIT 0, 500" + (action.randomize ? ") as derived_tbl ORDER BY rand()" : ""));
			newNations = conn.prepareStatement("SELECT nation, name, region_name FROM " + getTable(action.type) + " LIMIT 0, 500");
			result = newNations.executeQuery();
loop:		while(result.next()) {
				final int nationId = result.getInt(1);
				final String nation = result.getString(2);
				final String curRegion = result.getString(3);
				if (action.feedersOnly && !isInFeederRegion(curRegion)) {
					continue loop;
				}
				if (isSpamNation(nation)) {
					continue loop;
				}
				if (action.filterRegex != null && action.filterRegex.length() > 0) {
					try {
						Pattern pattern = Pattern.compile(action.filterRegex);
						if (pattern.matcher(nation).find()) {
							Logger.debug("Matched filter regex [ " + action.filterRegex + "] " + ", skipping: " + nation);
							continue loop;
						}
					} catch (Exception e) {
						Logger.debug("Unable to parse filter regex [ " + action.filterRegex + "] ", e);
						action.filterRegex = "";
						action.update(conn);
					}
				}
				if (action.avoidFull && countReceivedTelegrams(conn, nationId) > 15) {
					continue loop;
				}
				PreparedStatement prevRecruitment = conn.prepareStatement("SELECT nation_id FROM assembly.recruitment_history WHERE region = ? AND nation_id = ?");
				prevRecruitment.setInt(1, action.region);
				prevRecruitment.setInt(2, nationId);
				if (!prevRecruitment.executeQuery().next()) {
					return new Object[]{nation, nationId};
				}
			}
		} finally {
			DbUtils.closeQuietly(result);
			DbUtils.closeQuietly(newNations);
		}
		return null;
	}

	private boolean isSpamNation(String nation) {
		for (Pattern penalty : PENALTY_NAMES) {
			if (penalty.matcher(nation).find()) {
				return true;
			}
		}
		return false;
	}

	private boolean isInFeederRegion(String region) {
		for (int i = 0; i < FEEDER_REGIONS.length; i++) {
			if (FEEDER_REGIONS[i].equals(region)) {
				return true;
			}
		}
		return false;
	}

	private int countReceivedTelegrams(Connection conn, int nationId) throws SQLException {
		PreparedStatement sentTgs = null;
		ResultSet sent = null;
		try {
			sentTgs = conn.prepareStatement("SELECT count(id) FROM assembly.recruitment_history WHERE nation_id = ?");
			sentTgs.setInt(1, nationId);
			sent = sentTgs.executeQuery();
			if (sent.next()) {
				return sent.getInt(1);
			}
			return 0;
		} finally {
			DbUtils.closeQuietly(sent);
			DbUtils.closeQuietly(sentTgs);
		}
	}
}