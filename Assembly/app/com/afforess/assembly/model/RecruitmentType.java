package com.afforess.assembly.model;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.regex.Pattern;

import org.apache.commons.dbutils.DbUtils;
import org.joda.time.Duration;

import play.Logger;

public enum RecruitmentType {
	NEW_NATIONS(0),
	REFOUNDED_NATIONS(1),
	EJECTED_NATIONS(2),
	ACTIVE_GAMERITES(3),
	ACTIVE_USERITES(4),
	ACTIVE_NATIONS(5),
	CAPITALIST_NATIONS(6),
	SOCIALIST_NATIONS(7),
	CENTRIST_NATIONS(8),
	AUTHORITARIAN_NATIONS(9),
	LIBERTARIAN_NATIONS(10),
	LONELY_NATIONS(11);

	final int id;
	RecruitmentType(int id) {
		this.id = id;
	}

	public int getId() {
		return id;
	}

	public static RecruitmentType getById(int id) {
		for (RecruitmentType t : values()) {
			if (t.id == id) {
				return t;
			}
		}
		return null;
	}

	private PreparedStatement createRecruitmentStatement(Connection conn) throws SQLException {
		switch(this) {
			case NEW_NATIONS:
				return conn.prepareStatement("SELECT nation AS id, name, region FROM assembly.founded_nations WHERE puppet = 0 AND region <> ? ORDER BY timestamp DESC LIMIT ?, ?");
			case REFOUNDED_NATIONS:
				return conn.prepareStatement("SELECT nation AS id, name, region FROM assembly.refounded_nations WHERE puppet = 0 AND region <> ? ORDER BY timestamp DESC LIMIT ?, ?");
			case EJECTED_NATIONS:
				return conn.prepareStatement("SELECT nation AS id, name, region FROM assembly.ejected_nations WHERE puppet = 0 AND region <> ? ORDER BY timestamp DESC LIMIT ?, ?");
			case ACTIVE_GAMERITES:
				return conn.prepareStatement("SELECT id, name, region FROM assembly.nation WHERE alive = 1 AND puppet = 0 AND region <> ? AND region = 1167 OR region = 6223 OR region = 8243 " +
											"OR region = 11721 OR region = 13019 OR region = 13338 OR region = 13585 OR region = 14159 ORDER BY last_login DESC LIMIT ?, ?");
			case ACTIVE_NATIONS:
				return conn.prepareStatement("SELECT id, name, region FROM assembly.nation WHERE alive = 1 AND puppet = 0 AND region <> ? ORDER BY last_login DESC LIMIT ?, ?");
			case ACTIVE_USERITES:
				return conn.prepareStatement("SELECT id, name, region FROM assembly.nation WHERE alive = 1 AND puppet = 0 AND region <> ? AND region <> 1167 AND region <> 6223 AND region <> 8243 " +
						"AND region <> 11721 AND region <> 13019 AND region <> 13338 AND region <> 13585 AND region <> 14159 ORDER BY last_login DESC LIMIT ?, ?");
			case AUTHORITARIAN_NATIONS:
				return conn.prepareStatement("SELECT id, name, region FROM assembly.nation WHERE alive = 1 AND puppet = 0 AND region <> ? AND civilrightscore BETWEEN 0 AND 25 AND politicalfreedomscore BETWEEN 0 AND 25 ORDER BY last_login DESC LIMIT ?, ?");
			case CAPITALIST_NATIONS:
				return conn.prepareStatement("SELECT id, name, region FROM assembly.nation WHERE alive = 1 AND puppet = 0 AND region <> ? AND civilrightscore > 50 AND politicalfreedomscore > 50 AND economyscore > 90 AND tax < 50 ORDER BY last_login DESC LIMIT ?, ?");
			case CENTRIST_NATIONS:
				return conn.prepareStatement("SELECT id, name, region FROM assembly.nation WHERE alive = 1 AND puppet = 0 AND region <> ? AND civilrightscore BETWEEN 40 AND 70 AND politicalfreedomscore BETWEEN 40 AND 70 ORDER BY last_login DESC LIMIT ?, ?");
			case LIBERTARIAN_NATIONS:
				return conn.prepareStatement("SELECT id, name, region FROM assembly.nation WHERE alive = 1 AND puppet = 0 AND region <> ? AND civilrightscore > 85 AND politicalfreedomscore > 85 ORDER BY last_login DESC LIMIT ?, ?");
			case LONELY_NATIONS:
				return conn.prepareStatement("SELECT nation.id, nation.name, nation.region FROM assembly.nation LEFT JOIN assembly.region ON region.id = nation.region WHERE nation.alive = 1 AND nation.puppet = 0 AND nation.region <> ? AND region.population < 10 ORDER BY last_login DESC LIMIT ?, ?");
			case SOCIALIST_NATIONS:
				return conn.prepareStatement("SELECT id, name, region FROM assembly.nation WHERE alive = 1 AND puppet = 0 AND region <> ? AND civilrightscore > 50 AND politicalfreedomscore > 50 AND tax > 50 AND economyscore < 90 ORDER BY last_login DESC LIMIT ?, ?");
		}
		throw new IllegalStateException("Unknown RecruitmentType: " + name());
	}

	public String findRecruitmentNation(Connection conn, int region, boolean gcrsOnly, String filters) throws SQLException {
		PreparedStatement prevRecruitment = conn.prepareStatement("SELECT nation FROM assembly.recruitment_results WHERE region = ? AND nation = ? AND timestamp > ?");
		try {
			for (int attempts = 0; attempts < 10; attempts++) {
				PreparedStatement nations = createRecruitmentStatement(conn);
				nations.setInt(1, region);
				nations.setInt(2, attempts * 100);
				nations.setInt(3, 100);
				ResultSet set = nations.executeQuery();
				while(set.next()) {
					final int nationId = set.getInt("id");
					final String name = set.getString("name");
					final int regionId = set.getInt("region");

					if (gcrsOnly) {
						boolean isGCR = false;
						for (int gcr : GCRS) {
							if (regionId == gcr) {
								isGCR = true;
								break;
							}
						}
						if (!isGCR) {
							continue;
						}
					}

					if (isSpamNation(name)) {
						continue;
					}

					if (filters != null) {
						for (String filter : filters.split(", ")) {
							if (name.contains(filter)) {
								continue;
							}
						}
					}

					prevRecruitment.setInt(1, region);
					prevRecruitment.setInt(2, nationId);
					prevRecruitment.setLong(3, System.currentTimeMillis() - Duration.standardDays(31).getMillis());
					ResultSet result = prevRecruitment.executeQuery();
					if (result.next()) {
						DbUtils.closeQuietly(result);
						continue;
					}
					DbUtils.closeQuietly(result);

					DbUtils.closeQuietly(set);
					DbUtils.closeQuietly(nations);
					return name;
				}
			}
		} catch (SQLException e) {
			Logger.error("Error finding recruitment target (type: " + this.name() + ") [region: " + region + " | gcsrsOnly: " + gcrsOnly + " | filters: " + filters);
			throw e;
		} finally {
			DbUtils.closeQuietly(prevRecruitment);
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

	private static final int[] GCRS = {1167, 6223, 8243, 11721, 13019, 13338, 13585, 14159};
	private static final Pattern[] PENALTY_NAMES;
	static {
		String[] regex = {"nazi", "[0-9]", "puppet", "dead", "fag", "test", "spam", "switcher", "piss", "moderator"};
		PENALTY_NAMES = new Pattern[regex.length];
		for (int i = 0; i < regex.length; i++) {
			PENALTY_NAMES[i] = Pattern.compile(regex[i]);
		}
	}
}
