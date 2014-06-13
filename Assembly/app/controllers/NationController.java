package controllers;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.apache.commons.dbutils.DbUtils;
import org.joda.time.Duration;
import org.spout.cereal.config.yaml.YamlConfiguration;

import com.afforess.assembly.util.DatabaseAccess;
import com.afforess.assembly.util.Utils;
import com.limewoodMedia.nsapi.NationStates;

import play.libs.Json;
import play.mvc.Result;
import play.mvc.Results;

public class NationController extends NationStatesController {

	public NationController(DatabaseAccess access, YamlConfiguration config, NationStates api) {
		super(access, config, api);
	}

	public Result retrieveSettings(String name) throws SQLException, ExecutionException {
		Utils.handleDefaultPostHeaders(request(), response());
		final int nationId = getDatabase().getNationId(name);
		if (nationId == -1) {
			return Results.badRequest();
		}
		String json = getDatabase().getNationSettingsCache().get(nationId);
		if (!json.isEmpty()) {
			return Results.ok(json).as("application/json");
		}
		return Results.noContent();
	}

	public Result getLastSettingsUpdate(String name) throws SQLException {
		return getLastUpdate("last_settings_update", name);
	}

	public Result getLastDataUpdate(String name) throws SQLException {
		return getLastUpdate("last_data_update", name);
	}

	private Result getLastUpdate(String column, String name) throws SQLException {
		final int nationId = getDatabase().getNationId(name);
		if (nationId == -1) {
			Utils.handleDefaultPostHeaders(request(), response());
			return Results.badRequest();
		}
		Connection conn = null;
		PreparedStatement select = null;
		ResultSet set = null;
		try {
			conn = getConnection();
			select = conn.prepareStatement("SELECT " + column + " FROM assembly.ns_settings WHERE id = ?");
			select.setInt(1, nationId);
			set = select.executeQuery();
			if (set.next()) {
				Map<String, Object> json = new HashMap<String, Object>(1);
				json.put("timestamp", set.getLong(1));
				Result r = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(json.hashCode()), "10");
				if (r != null) return r;
				return Results.ok(Json.toJson(json)).as("application/json");
			}
		} finally {
			DbUtils.closeQuietly(set);
			DbUtils.closeQuietly(select);
			DbUtils.closeQuietly(conn);
		}
		Result r = Utils.handleDefaultGetHeaders(request(), response(), "0000000", "10");
		if (r != null) return r;
		return Results.noContent();
	}

	public Result updateSettings() throws SQLException {
		Result result = Utils.validateRequest(request(), response(), getAPI(), getDatabase());
		if (result != null) {
			return result;
		}
		Utils.handleDefaultPostHeaders(request(), response());
		final String nation = Utils.getPostValue(request(), "nation");
		final String settings = Utils.getPostValue(request(), "settings");
		final int nationId = getDatabase().getNationId(nation);
		if (nationId == -1 || settings == null) {
			return Results.badRequest();
		}
		Connection conn = null;
		PreparedStatement select = null;
		ResultSet set = null;
		try {
			conn = getConnection();
			select = conn.prepareStatement("SELECT last_settings_update FROM assembly.ns_settings WHERE id = ?");
			select.setInt(1, nationId);
			set = select.executeQuery();
			if (set.next()) {
				PreparedStatement update = conn.prepareStatement("UPDATE assembly.ns_settings SET settings = ?, last_settings_update = ? WHERE id = ?");
				update.setString(1, settings);
				update.setLong(2, System.currentTimeMillis());
				update.setInt(3, nationId);
				update.executeUpdate();
				DbUtils.closeQuietly(update);
			} else {
				PreparedStatement insert = conn.prepareStatement("INSERT INTO assembly.ns_settings (id, settings, last_settings_update) VALUES (?, ?, ?)");
				insert.setInt(1, nationId);
				insert.setString(2, settings);
				insert.setLong(3, System.currentTimeMillis());
				insert.executeUpdate();
				DbUtils.closeQuietly(insert);
			}
			getDatabase().getNationSettingsCache().put(nationId, settings);
			return Results.ok();
		} finally {
			DbUtils.closeQuietly(set);
			DbUtils.closeQuietly(select);
			DbUtils.closeQuietly(conn);
		}
	}

	public Result retrieveData() throws SQLException {
		Result result = Utils.validateRequest(request(), response(), getAPI(), getDatabase());
		if (result != null) {
			return result;
		}
		Utils.handleDefaultPostHeaders(request(), response());
		final String nation = Utils.getPostValue(request(), "nation");
		final int nationId = getDatabase().getNationId(nation);
		if (nationId == -1) {
			return Results.badRequest();
		}
		Connection conn = null;
		PreparedStatement select = null;
		ResultSet set = null;
		try {
			conn = getConnection();
			select = conn.prepareStatement("SELECT data FROM assembly.ns_settings WHERE id = ?");
			select.setInt(1, nationId);
			set = select.executeQuery();
			if (set.next()) {
				String json = set.getString(1);
				if (!set.wasNull()) {
					return Results.ok(json).as("application/json");
				}
			}
		} finally {
			DbUtils.closeQuietly(set);
			DbUtils.closeQuietly(select);
			DbUtils.closeQuietly(conn);
		}
		return Results.noContent();
	}

	public Result getAuthCode() throws SQLException {
		Result result = Utils.validateRequest(request(), response(), getAPI(), getDatabase());
		if (result != null) {
			return result;
		}
		HashMap<String, Object> data = new HashMap<String, Object>();
		
		final int nationId = getDatabase().getNationId(Utils.getPostValue(request(), "nation"));
		Connection conn = null;
		try {
			conn = getConnection();
			PreparedStatement statement = conn.prepareStatement("SELECT auth, time from assembly.nation_auth WHERE nation_id = ? AND time > ? LIMIT 0, 1");
			statement.setInt(1, nationId);
			//No point giving user a code about to expire...
			statement.setLong(2, System.currentTimeMillis() + Duration.standardHours(1).getMillis());
			ResultSet set = statement.executeQuery();
			if (set.next()) {
				data.put("code", set.getString(1));
				data.put("expires", set.getLong(2));
			} else {
				data.put("code", getDatabase().generateAuthToken(nationId, true, null));
				data.put("expires", System.currentTimeMillis() + Duration.standardDays(1).getMillis());
			}
			DbUtils.closeQuietly(set);
			DbUtils.closeQuietly(statement);
		} finally {
			DbUtils.closeQuietly(conn);
		}
		Utils.handleDefaultPostHeaders(request(), response());
		return Results.ok(Json.toJson(data)).as("application/json");
	}

	public Result updateData() throws SQLException {
		Result result = Utils.validateRequest(request(), response(), getAPI(), getDatabase());
		if (result != null) {
			return result;
		}
		Utils.handleDefaultPostHeaders(request(), response());
		final String nation = Utils.getPostValue(request(), "nation");
		final String data = Utils.getPostValue(request(), "data");
		final int nationId = getDatabase().getNationId(nation);
		if (nationId == -1 || data == null) {
			return Results.badRequest();
		}
		Connection conn = null;
		PreparedStatement select = null;
		ResultSet set = null;
		try {
			conn = getConnection();
			select = conn.prepareStatement("SELECT last_data_update FROM assembly.ns_settings WHERE id = ?");
			select.setInt(1, nationId);
			set = select.executeQuery();
			if (set.next()) {
				PreparedStatement update = conn.prepareStatement("UPDATE assembly.ns_settings SET data = ?, last_data_update = ? WHERE id = ?");
				update.setString(1, data);
				update.setLong(2, System.currentTimeMillis());
				update.setInt(3, nationId);
				update.executeUpdate();
				DbUtils.closeQuietly(update);
			} else {
				PreparedStatement insert = conn.prepareStatement("INSERT INTO assembly.ns_settings (id, data, last_data_update) VALUES (?, ?, ?)");
				insert.setInt(1, nationId);
				insert.setString(2, data);
				insert.setLong(3, System.currentTimeMillis());
				insert.executeUpdate();
				DbUtils.closeQuietly(insert);
			}
			return Results.ok();
		} finally {
			DbUtils.closeQuietly(set);
			DbUtils.closeQuietly(select);
			DbUtils.closeQuietly(conn);
		}
	}
}
