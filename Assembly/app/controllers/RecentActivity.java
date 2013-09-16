package controllers;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.codehaus.jackson.annotate.JsonProperty;

import com.afforess.assembly.util.NationCache;
import com.afforess.assembly.util.RegionCache;
import com.afforess.assembly.util.Utils;
import com.mchange.v2.c3p0.ComboPooledDataSource;

import play.Logger;
import play.mvc.*;
import play.libs.Json;

public class RecentActivity extends DatabaseController {
	private static long cacheTime = 0L;
	private static List<WAActivity> cachedWAActivity = null;

	public RecentActivity(ComboPooledDataSource pool, NationCache cache, RegionCache regionCache) {
		super(pool, cache, regionCache);
	}

	public Result getRecentActivity(boolean refresh) throws SQLException {
		Map<String, Object> json = new HashMap<String, Object>();

		Connection conn = null;
		
		try {
			conn = getConnection();
			json.put("inactive_nations", getInactiveNations(conn));
			json.put("active_nations", getActiveNations(conn));
			json.put("newcomers", getNewcomers(conn));
			if (System.currentTimeMillis() > cacheTime || refresh) {
				cachedWAActivity = getWAMovers(conn);
				cacheTime = System.currentTimeMillis() + 1L * 60L * 60L * 1000L;
				
				Logger.info("Refreshing recent activity");
			}
			json.put("wa_movers", cachedWAActivity);
		} finally {
			if (conn != null) {
				conn.close();
			}
		}

		Result result = Utils.handleDefaultHeaders(request(), response(), String.valueOf(json.hashCode()));
		if (result != null) {
			return result;
		}
		return ok(Json.toJson(json)).as("application/json");
	}

	private List<WAActivity> getWAMovers(Connection conn) throws SQLException {
		List<WAActivity> movers = new ArrayList<WAActivity>();
		PreparedStatement select = conn.prepareStatement("SELECT id, name, formatted_name, flag FROM assembly.nation WHERE alive = 1 AND wa_member = 1 AND region = 'Capitalist Paradise'");
		ResultSet result = select.executeQuery();
		List<NationTuple> nations = new ArrayList<NationTuple>();
		while(result.next()) {
			nations.add(new NationTuple(result.getInt(1), result.getString(2), result.getString(3), result.getString(4)));
		}
		
		PreparedStatement waHistory = conn.prepareStatement("SELECT endorsements, timestamp FROM assembly.nation_history WHERE nation_id = ? AND timestamp > ?");
		for (NationTuple nation : nations) {
			waHistory.setInt(1, nation.id);
			waHistory.setLong(2, (System.currentTimeMillis() / 1000L) - 7 * 24 * 60 * 60);
			ResultSet history = waHistory.executeQuery();
			List<EndorsementHistory> activity = new ArrayList<EndorsementHistory>();
			while(history.next()) {
				activity.add(new EndorsementHistory(history.getInt(1), history.getLong(2)));
			}
			Collections.sort(activity);
			if (activity.size() > 0) {
				movers.add(new WAActivity(nation.name, nation.formattedName, nation.flag, activity.get(0).endorsements - activity.get(activity.size() - 1).endorsements));
			}
		}
		
		Collections.sort(movers);
		return movers;
	}

	private static class NationTuple {
		private final int id;
		private final String name;
		private final String formattedName;
		private final String flag;
		public NationTuple(int id, String name, String formattedName, String flag) {
			this.id = id;
			this.name = name;
			this.formattedName = formattedName;
			this.flag = flag;
		}
	}

	private List<NationActivity> getNewcomers(Connection conn) throws SQLException {
		List<NationActivity> newcomers = new ArrayList<NationActivity>();
		PreparedStatement select = conn.prepareStatement("SELECT name, formatted_name, flag, first_seen FROM assembly.nation WHERE alive = 1 AND first_seen > ? AND region = 'Capitalist Paradise'");
		select.setLong(1, (System.currentTimeMillis() / 1000L) - 7L * 24 * 60 * 60);
		ResultSet result = select.executeQuery();
		while(result.next()) {
			newcomers.add(new NationActivity(result.getString(1), result.getString(2), result.getString(3), result.getLong(4)));
		}
		Collections.sort(newcomers);
		return newcomers;
	}

	private List<NationActivity> getActiveNations(Connection conn) throws SQLException {
		List<NationActivity> activeNations = new ArrayList<NationActivity>();
		PreparedStatement select = conn.prepareStatement("SELECT name, formatted_name, flag, last_login FROM assembly.nation WHERE alive = 1 AND last_login <> 0 AND last_login > ?");
		select.setLong(1, (System.currentTimeMillis() / 1000L) - 2L * 24 * 60 * 60);
		ResultSet result = select.executeQuery();
		while(result.next()) {
			activeNations.add(new NationActivity(result.getString(1), result.getString(2), result.getString(3), result.getLong(4)));
		}
		Collections.sort(activeNations);
		return activeNations;
	}

	private List<NationActivity> getInactiveNations(Connection conn) throws SQLException {
		List<NationActivity> inactiveNations = new ArrayList<NationActivity>();
		PreparedStatement select = conn.prepareStatement("SELECT name, formatted_name, flag, last_login FROM assembly.nation WHERE alive = 1 AND last_login <> 0 AND last_login < ?");
		select.setLong(1, (System.currentTimeMillis() / 1000L) - 10L * 24 * 60 * 60);
		ResultSet result = select.executeQuery();
		while(result.next()) {
			inactiveNations.add(new NationActivity(result.getString(1), result.getString(2), result.getString(3), result.getLong(4)));
		}
		Collections.sort(inactiveNations);
		Collections.reverse(inactiveNations);
		return inactiveNations;
	}

	private static class WAActivity implements Comparable<WAActivity> {
		@JsonProperty("name")
		private final String name;
		@JsonProperty("endorsement_change")
		private final int change;
		@JsonProperty("formatted_name")
		private final String formattedName;
		@JsonProperty("flag")
		private final String flag;
		public WAActivity(String name, String formattedName, String flag, int change) {
			this.name = name;
			this.formattedName = formattedName;
			this.flag = flag;
			this.change = change;
		}

		@Override
		public int compareTo(WAActivity o) {
			return Integer.compare(o.change, change);
		}
	}

	private static class EndorsementHistory implements Comparable<EndorsementHistory>{
		private final int endorsements;
		private final long timestamp;
		public EndorsementHistory(int endorsements, long timestamp) {
			this.endorsements = endorsements;
			this.timestamp = timestamp;
		}

		@Override
		public int compareTo(EndorsementHistory o) {
			return Long.compare(o.timestamp, timestamp);
		}
	}

	private static class NationActivity implements Comparable<NationActivity>{
		@JsonProperty("name")
		private final String name;
		@JsonProperty("last_login")
		private final long lastLogin;
		@JsonProperty("formatted_name")
		private final String formattedName;
		@JsonProperty("flag")
		private final String flag;
		public NationActivity(String name, String formattedName, String flag, long lastLogin) {
			this.name = name;
			this.formattedName = formattedName;
			this.flag = flag;
			this.lastLogin = lastLogin;
		}

		@Override
		public int compareTo(NationActivity o) {
			return Long.compare(o.lastLogin, lastLogin);
		}
	}
}
