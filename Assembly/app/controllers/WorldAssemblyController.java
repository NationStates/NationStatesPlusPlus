package controllers;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.apache.commons.dbutils.DbUtils;
import org.joda.time.Duration;
import org.spout.cereal.config.yaml.YamlConfiguration;

import play.libs.Json;
import play.mvc.Result;

import com.afforess.assembly.model.HappeningType;
import com.afforess.assembly.model.Nation;
import com.afforess.assembly.util.DatabaseAccess;
import com.afforess.assembly.util.Utils;

public class WorldAssemblyController extends DatabaseController {

	public WorldAssemblyController(DatabaseAccess access, YamlConfiguration config) {
		super(access, config);
	}

	public Result getWAMembers(String region) throws SQLException, ExecutionException {
		Map<String, Map<String, Object>> json = new HashMap<String, Map<String, Object>>();
		Connection conn = null; 
		try {
			conn = getConnection();
			PreparedStatement statement = conn.prepareStatement("SELECT title, influence, influence_desc, count(e.endorsed) AS endorsements from assembly.nation AS n LEFT OUTER JOIN assembly.endorsements AS e ON n.id = e.endorsed WHERE alive = 1 AND wa_member = 1 AND region = ? GROUP BY title;");
			statement.setInt(1, getDatabase().getRegionId(region));
			ResultSet result = statement.executeQuery();
			while(result.next()) {
				String nation = result.getString(1);
				HashMap<String, Object> values = new HashMap<String, Object>();
				values.put("endorsements", result.getInt(4));
				values.put("influence", result.getInt(2));
				values.put("influence_desc", result.getString(3));
				json.put(nation, values);
			}
			DbUtils.closeQuietly(result);
			DbUtils.closeQuietly(statement);
		} finally {
			DbUtils.closeQuietly(conn);
		}

		Result result = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(json.hashCode()));
		if (result != null) {
			return result;
		}
		return ok(Json.toJson(json)).as("application/json");
	}

	public Result getEndorsements(String name, boolean fullData) throws SQLException, ExecutionException {
		List<Object> nations = new ArrayList<Object>();
		Connection conn = null; 
		try {
			conn = getConnection();
			PreparedStatement statement = conn.prepareStatement("SELECT n.title " + (fullData ? ", n.name, n.id, n.full_name, n.flag " : "") + "FROM assembly.nation AS n LEFT OUTER JOIN assembly.endorsements AS e ON n.id = e.endorsed WHERE e.endorser = ?");
			statement.setInt(1, getDatabase().getNationId(name));
			ResultSet result = statement.executeQuery();
			while(result.next()) {
				String title = result.getString(1);
				nations.add(fullData ? (new Nation(result.getString(2), title, result.getString(4), result.getString(5), result.getInt(3), true, true)) : title);
			}
			DbUtils.closeQuietly(result);
			DbUtils.closeQuietly(statement);
		} finally {
			DbUtils.closeQuietly(conn);
		}

		Result result = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(nations.hashCode()));
		if (result != null) {
			return result;
		}
		return ok(Json.toJson(nations)).as("application/json");
	}

	public Result getMissingEndorsements(String name, boolean fullData) throws SQLException, ExecutionException {
		List<Object> nations = new ArrayList<Object>();
		Connection conn = null; 
		try {
			int nationId = getDatabase().getNationId(name);
			HashSet<Integer> endorsements = new HashSet<Integer>();
			conn = getConnection();
			PreparedStatement statement = conn.prepareStatement("SELECT endorsed FROM assembly.endorsements WHERE endorser = ?");
			statement.setInt(1, nationId);
			ResultSet result = statement.executeQuery();
			while(result.next()) {
				endorsements.add(result.getInt(1));
			}
			DbUtils.closeQuietly(result);
			DbUtils.closeQuietly(statement);
			
			statement = conn.prepareStatement("SELECT id, title " + (fullData ? ", name, full_name, flag " : "") + "FROM assembly.nation WHERE alive = 1 AND wa_member = 1 AND region = (SELECT region FROM assembly.nation WHERE id = ?)");
			statement.setInt(1, nationId);
			result = statement.executeQuery();
			while(result.next()) {
				if (!endorsements.contains(result.getInt(1)) && result.getInt(1) != nationId) {
					nations.add(fullData ? (new Nation(result.getString(3), result.getString(2), result.getString(4), result.getString(5), result.getInt(1), true, true)) : result.getString(2));
				}
			}
			DbUtils.closeQuietly(result);
			DbUtils.closeQuietly(statement);
		} finally {
			DbUtils.closeQuietly(conn);
		}

		Result result = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(nations.hashCode()));
		if (result != null) {
			return result;
		}
		return ok(Json.toJson(nations)).as("application/json");
	}

	public Result getUnreturnedEndorsements(String name, boolean fullData) throws SQLException, ExecutionException {
		List<Object> nations = new ArrayList<Object>();
		Connection conn = null; 
		try {
			int nationId = getDatabase().getNationId(name);
			HashSet<Integer> endorsements = new HashSet<Integer>();
			conn = getConnection();
			PreparedStatement statement = conn.prepareStatement("SELECT endorser FROM assembly.endorsements WHERE endorsed = ?");
			statement.setInt(1, nationId);
			ResultSet result = statement.executeQuery();
			while(result.next()) {
				endorsements.add(result.getInt(1));
			}
			DbUtils.closeQuietly(result);
			DbUtils.closeQuietly(statement);
			
			statement = conn.prepareStatement("SELECT id, title " + (fullData ? ", name, full_name, flag " : "") + "FROM assembly.nation WHERE alive = 1 AND wa_member = 1 AND region = (SELECT region FROM assembly.nation WHERE id = ?)");
			statement.setInt(1, nationId);
			result = statement.executeQuery();
			while(result.next()) {
				if (!endorsements.contains(result.getInt(1)) && result.getInt(1) != nationId) {
					nations.add(fullData ? (new Nation(result.getString(3), result.getString(2), result.getString(4), result.getString(5), result.getInt(1), true, true)) : result.getString(2));
				}
			}
			DbUtils.closeQuietly(result);
			DbUtils.closeQuietly(statement);
		} finally {
			DbUtils.closeQuietly(conn);
		}

		Result result = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(nations.hashCode()));
		if (result != null) {
			return result;
		}
		return ok(Json.toJson(nations)).as("application/json");
	}

	public Result getWADelegates() throws SQLException {
		List<String> delegates = new ArrayList<String>();
		Connection conn = null; 
		try {
			conn = getConnection();
			PreparedStatement select = conn.prepareStatement("SELECT delegate FROM assembly.region WHERE delegate <> \"0\" AND alive = 1");
			ResultSet set = select.executeQuery();
			while(set.next()) {
				delegates.add(set.getString(1));
			}
			DbUtils.closeQuietly(set);
			DbUtils.closeQuietly(select);
		} finally {
			DbUtils.closeQuietly(conn);
		}
		Result result = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(delegates.hashCode()));
		if (result != null) {
			return result;
		}
		return ok(Json.toJson(delegates)).as("application/json");
	}

	private Map<String, Object> getResolution(Connection conn, int council) throws SQLException {
		Map<String, Object> resolution = new HashMap<String, Object>();
		PreparedStatement select = conn.prepareStatement("SELECT id, name FROM assembly.wa_resolutions WHERE council = ? ORDER BY created DESC LIMIT 0, 1");
		select.setInt(1, council);
		ResultSet set = select.executeQuery();
		if (set.next()) {
			resolution.put("id", set.getInt(1));
			resolution.put("name", set.getString(2));
			PreparedStatement votes = conn.prepareStatement("SELECT timestamp, nation_votes_against, nation_votes_for FROM assembly.wa_votes WHERE wa_resolution = ? ORDER BY timestamp DESC LIMIT 0, 1");
			votes.setInt(1, set.getInt(1));
			ResultSet voteResults = votes.executeQuery();
			if (voteResults.next()) {
				resolution.put("last_update", voteResults.getLong(1));
				resolution.put("nation_votes_against", voteResults.getInt(2));
				resolution.put("nation_votes_for", voteResults.getInt(3));
			}
			DbUtils.closeQuietly(voteResults);
			DbUtils.closeQuietly(votes);
		}
		DbUtils.closeQuietly(set);
		DbUtils.closeQuietly(select);
		return resolution;
	}

	public Result getIndividualWAVotes() throws SQLException {
		List<Map<String, Object>> resolutions = new LinkedList<Map<String, Object>>();
		Connection conn = null;
		try {
			conn = getConnection();
			long lastUpdate = Integer.MAX_VALUE;
			//We are assuming the newest resolutions are the ones at vote...is this always true?
			resolutions.add(getResolution(conn, 0));
			resolutions.add(getResolution(conn, 1));
			
			for (Map<String, Object> res : resolutions) {
				lastUpdate = Math.min(lastUpdate, (Long)res.get("last_update"));
			}
			
			int expires = 300;
			if (lastUpdate != Integer.MAX_VALUE) {
				lastUpdate /= 1000L;
				//Votes update each hour. Tell client to keep response until next hourly update.
				expires = (int) (lastUpdate + 3600 - (System.currentTimeMillis() / 1000L));
			} else {
				expires = 300;
			}
			Result result = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(resolutions.hashCode()), String.valueOf(expires));
			if (result != null) {
				return result;
			}
			return ok(Json.toJson(resolutions)).as("application/json");
		} finally {
			DbUtils.closeQuietly(conn);
		}
	}

	private List<Map<String, String>> powerTransfers = null;
	private long nextCache = 0;
	public Result getRecentPowerTransfers() throws SQLException {
		if (powerTransfers == null || nextCache < System.currentTimeMillis()) {
			Connection conn = null;
			PreparedStatement select = null;
			ResultSet result = null;
			List<Map<String, String>> transfers = new ArrayList<Map<String, String>>();
			try {
				conn = getConnection();
				select = conn.prepareStatement("SELECT g.type, re.name, re.title, re.flag, n.name AS nation_name, n.title AS nation_title, n.flag AS nation_flag, g.timestamp FROM ((assembly.global_happenings AS g LEFT JOIN assembly.regional_happenings AS r ON g.id = r.global_id) LEFT JOIN assembly.region AS re ON re.id = r.region) LEFT JOIN assembly.nation AS n ON n.id = g.nation WHERE g.timestamp > ? AND (type = 32 OR g.type = 33) ORDER BY g.timestamp DESC");
				select.setLong(1, System.currentTimeMillis() - Duration.standardHours(30).getMillis());
				result = select.executeQuery();
				while(result.next()) {
					Map<String, String> data = new HashMap<String, String>();
					data.put("type", HappeningType.getType(result.getInt(1)).getName());
					data.put("region", result.getString(2));
					data.put("region_title", result.getString(3));
					data.put("region_flag", result.getString(4));
					data.put("delegate", result.getString(5));
					data.put("delegate_title", result.getString(6));
					data.put("delegate_flag", result.getString(7));
					data.put("timestamp", String.valueOf(result.getLong(8)));
					
					transfers.add(data);
				}
			} finally {
				DbUtils.closeQuietly(conn);
			}
			
			powerTransfers = transfers;
			nextCache = System.currentTimeMillis() + Duration.standardHours(1).getMillis();
		}
		
		Result r = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(powerTransfers.hashCode()), "21600");
		if (r != null) {
			return r;
		}
		return ok(Json.toJson(powerTransfers)).as("application/json");
	}
}
