package com.afforess.assembly;

import java.io.IOException;
import java.net.URL;
import java.net.URLConnection;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashSet;
import java.util.List;
import java.util.regex.Pattern;

import org.apache.commons.dbutils.DbUtils;
import org.apache.commons.io.IOUtils;
import org.joda.time.Duration;

import play.Logger;

import com.afforess.assembly.model.RecruitmentAction;
import com.afforess.assembly.model.RecruitmentType;
import com.afforess.assembly.util.DatabaseAccess;

public class RecruitmentTask implements Runnable {
	private static final String[] FEEDER_REGIONS = {"the_north_pacific", "the_pacific", "the_east_pacific", "the_west_pacific", "the_south_pacific", "the_rejected_realms", "lazarus", "osiris", "balder"};
	private static final String[] PENALTY_NAMES = {"nazi", "[0-9]", "puppet", "dead", "fag", "test"};
	private final DatabaseAccess access;
	public RecruitmentTask(DatabaseAccess access) {
		this.access = access;
	}

	@Override
	public void run() {
		try {
			runImpl();
		} catch (Exception e) {
			Logger.error("Exception processing recruitment", e);
		}
	}

	public void runImpl() throws SQLException, IOException {
		Connection conn = null;
		try {
			conn = access.getPool().getConnection();
			HashSet<Integer> regionsRecruited = new HashSet<Integer>();
			List<RecruitmentAction> actions = RecruitmentAction.getAllActions(conn);
			for (RecruitmentAction action : actions) {
				long delay = Duration.standardSeconds((int)(180 * (100F / action.percent)) + 1).getMillis();
				if (regionsRecruited.contains(action.region)){
					action.lastAction = Math.max(action.lastAction,  System.currentTimeMillis() + Duration.standardSeconds(180).getMillis());
					action.update(conn);
					continue;
				}
				if (action.error == 0 && action.lastAction < System.currentTimeMillis()) {
					Object[] nation = findTargetNation(action, conn);
					if (nation != null) {
						try {
							if (sendTelegram(action, (String)nation[0]) != null) {
								regionsRecruited.add(action.region);
								action.lastAction = System.currentTimeMillis() + delay;
								action.update(conn);
								PreparedStatement update = conn.prepareStatement("INSERT INTO assembly.recruitment_history (region, nation_id, tgid) VALUES (?, ?, ?)");
								update.setInt(1, action.region);
								update.setInt(2, (Integer)nation[1]);
								update.setString(3, action.tgid);
								update.executeUpdate();
							}
						} catch (IOException io) {
							if (io.getMessage().toLowerCase().contains("http response code: 429")) {
								action.lastAction = System.currentTimeMillis() + Duration.standardMinutes(15).getMillis();
								action.update(conn);
							} else if (io.getMessage().toLowerCase().contains("http response code: 403")) {
								action.error = 1;
								action.update(conn);
							} else {
								throw io;
							}
						}
					}
				}
			}
		} finally {
			DbUtils.closeQuietly(conn);
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
		try {
			newNations = conn.prepareStatement((action.randomize ? "SELECT * FROM ( " : "") + "SELECT nation, name, region_name FROM " + getTable(action.type) + " LIMIT 0, 500" + (action.randomize ? ") as derived_tbl ORDER BY rand()" : ""));
			ResultSet result = newNations.executeQuery();
loop:		while(result.next()) {
				final int nationId = result.getInt(1);
				final String nation = result.getString(2);
				if (action.feedersOnly) {
					boolean valid = false;
					String curRegion = result.getString(3);
					for (int i = 0; i < FEEDER_REGIONS.length; i++) {
						if (FEEDER_REGIONS[i].equals(curRegion)) {
							valid = true;
							break;
						}
					}
					if (!valid) {
						continue loop;
					}
				}
				for (String penalty : PENALTY_NAMES) {
					Pattern pattern = Pattern.compile(penalty);
					if (pattern.matcher(nation).find()) {
						Logger.debug("Matched penalty regex, skipping: " + nation);
						continue loop;
					}
				}
				if (action.filterRegex != null && action.filterRegex.length() > 0) {
					try {
						Pattern pattern = Pattern.compile(action.filterRegex);
						if (pattern.matcher(nation).find()) {
							Logger.debug("Matched filter regex, skipping: " + nation);
							continue loop;
						}
					} catch (Exception e) {
						Logger.debug("Unable to parse filter regex", e);
					}
				}
				if (action.avoidFull) {
					PreparedStatement sentTgs = conn.prepareStatement("SELECT count(id) FROM assembly.recruitment_history WHERE nation_id = ?");
					sentTgs.setInt(1, nationId);
					ResultSet sent = sentTgs.executeQuery();
					if (sent.next() && sent.getInt(1) > 15) {
						continue loop;
					}
				}
				PreparedStatement prevRecruitment = conn.prepareStatement("SELECT nation_id FROM assembly.recruitment_history WHERE region = ? AND nation_id = ?");
				prevRecruitment.setInt(1, action.region);
				prevRecruitment.setInt(2, nationId);
				if (!prevRecruitment.executeQuery().next()) {
					return new Object[]{nation, nationId};
				}
			}
		} finally {
			DbUtils.closeQuietly(newNations);
		}
		return null;
	}

	private String sendTelegram(RecruitmentAction action, String nation) throws IOException {
		URL url = new URL("http://www.nationstates.net/cgi-bin/api.cgi?a=sendTG&client=" + action.clientKey + "&tgid=" + action.tgid + "&key=" + action.secretKey + "&to=" + nation);
		URLConnection connection = url.openConnection();
		connection.setRequestProperty("user-agent", "-- NationStates++ Recruitment Server --");
		connection.connect();
		return IOUtils.readLines(connection.getInputStream()).get(0);
	}
}
