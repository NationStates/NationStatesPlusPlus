package controllers;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.apache.commons.dbutils.DbUtils;
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
		final int nationId = getDatabase().getNationIdCache().get(Utils.sanitizeName(name));
		if (nationId == -1) {
			return Results.badRequest();
		}
		Connection conn = null;
		try {
			conn = getConnection();
			PreparedStatement select = conn.prepareStatement("SELECT settings FROM assembly.ns_settings WHERE id = ?");
			select.setInt(1, nationId);
			ResultSet set = select.executeQuery();
			if (set.next()) {
				String json = set.getString(1);
				if (!set.wasNull()) {
					return Results.ok(json).as("application/json");
				}
			}
		} finally {
			DbUtils.closeQuietly(conn);
		}
		return Results.noContent();
	}

	public Result getLastSettingsUpdate(String name) throws SQLException, ExecutionException {
		Utils.handleDefaultPostHeaders(request(), response());
		final int nationId = getDatabase().getNationIdCache().get(Utils.sanitizeName(name));
		if (nationId == -1) {
			return Results.badRequest();
		}
		Connection conn = null;
		try {
			conn = getConnection();
			PreparedStatement select = conn.prepareStatement("SELECT last_update FROM assembly.ns_settings WHERE id = ?");
			select.setInt(1, nationId);
			ResultSet set = select.executeQuery();
			if (set.next()) {
				Map<String, Object> json = new HashMap<String, Object>(1);
				json.put("timestamp", set.getLong(1));
				return Results.ok(Json.toJson(json)).as("application/json");
			}
		} finally {
			DbUtils.closeQuietly(conn);
		}
		return Results.noContent();
	}

	public Result updateSettings() throws SQLException, ExecutionException {
		Result result = Utils.validateRequest(request(), response(), getAPI(), getDatabase());
		if (result != null) {
			return result;
		}
		Utils.handleDefaultPostHeaders(request(), response());
		final String nation = Utils.getPostValue(request(), "nation");
		final String settings = Utils.getPostValue(request(), "settings");
		final int nationId = getDatabase().getNationIdCache().get(Utils.sanitizeName(nation));
		if (nationId == -1 || settings == null) {
			return Results.badRequest();
		}
		Connection conn = null;
		try {
			conn = getConnection();
			PreparedStatement select = conn.prepareStatement("SELECT last_update FROM assembly.ns_settings WHERE id = ?");
			select.setInt(1, nationId);
			ResultSet set = select.executeQuery();
			if (set.next()) {
				PreparedStatement update = conn.prepareStatement("UPDATE assembly.ns_settings SET settings = ?, last_update = ? WHERE id = ?");
				update.setString(1, settings);
				update.setLong(2, System.currentTimeMillis());
				update.setInt(3, nationId);
				update.executeUpdate();
			} else {
				PreparedStatement insert = conn.prepareStatement("INSERT INTO assembly.ns_settings (id, settings, last_update) VALUES (?, ?, ?)");
				insert.setInt(1, nationId);
				insert.setString(2, settings);
				insert.setLong(3, System.currentTimeMillis());
				insert.executeUpdate();
			}
			return Results.ok();
		} finally {
			DbUtils.closeQuietly(conn);
		}
	}

	public Result retrieveIssues(String nation) throws SQLException, ExecutionException {
		Utils.handleDefaultPostHeaders(request(), response());
		final int nationId = getDatabase().getNationIdCache().get(Utils.sanitizeName(nation));
		if (nationId == -1) {
			return Results.badRequest();
		}
		Connection conn = null;
		try {
			conn = getConnection();
			PreparedStatement select = conn.prepareStatement("SELECT issues FROM assembly.ns_settings WHERE id = ?");
			select.setInt(1, nationId);
			ResultSet set = select.executeQuery();
			if (set.next()) {
				String json = set.getString(1);
				if (!set.wasNull()) {
					return Results.ok(json).as("application/json");
				}
			}
		} finally {
			DbUtils.closeQuietly(conn);
		}
		return Results.noContent();
	}

	public Result updateIssues() throws SQLException, ExecutionException {
		Result result = Utils.validateRequest(request(), response(), getAPI(), getDatabase());
		if (result != null) {
			return result;
		}
		Utils.handleDefaultPostHeaders(request(), response());
		final String nation = Utils.getPostValue(request(), "nation");
		final String issues = Utils.getPostValue(request(), "issues");
		final int nationId = getDatabase().getNationIdCache().get(Utils.sanitizeName(nation));
		if (nationId == -1 || issues == null) {
			return Results.badRequest();
		}
		Connection conn = null;
		try {
			conn = getConnection();
			PreparedStatement select = conn.prepareStatement("SELECT last_update FROM assembly.ns_settings WHERE id = ?");
			select.setInt(1, nationId);
			ResultSet set = select.executeQuery();
			if (set.next()) {
				PreparedStatement update = conn.prepareStatement("UPDATE assembly.ns_settings SET issues = ?, last_update = ? WHERE id = ?");
				update.setString(1, issues);
				update.setLong(2, System.currentTimeMillis());
				update.setInt(3, nationId);
				update.executeUpdate();
			} else {
				PreparedStatement insert = conn.prepareStatement("INSERT INTO assembly.ns_settings (id, issues, last_update) VALUES (?, ?, ?)");
				insert.setInt(1, nationId);
				insert.setString(2, issues);
				insert.setLong(3, System.currentTimeMillis());
				insert.executeUpdate();
			}
			return Results.ok();
		} finally {
			DbUtils.closeQuietly(conn);
		}
	}
}
