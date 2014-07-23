package controllers;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import net.nationstatesplusplus.assembly.util.DatabaseAccess;
import net.nationstatesplusplus.assembly.util.Utils;

import org.apache.commons.dbutils.DbUtils;
import org.apache.commons.lang3.text.WordUtils;
import org.spout.cereal.config.yaml.YamlConfiguration;

import play.libs.Json;
import play.mvc.Result;
import play.mvc.Results;

public class AutocompleteController extends DatabaseController {

	public AutocompleteController(DatabaseAccess access, YamlConfiguration config) {
		super(access, config);
	}

	public Result autocompleteNation(String start) throws SQLException {
		ArrayList<String> nations = new ArrayList<String>();
		if (start == null || start.length() < 3) {
			Utils.handleDefaultPostHeaders(request(), response());
			return Results.badRequest();
		}
		
		Connection conn = null;
		try {
			conn = getConnection();
			PreparedStatement select = conn.prepareStatement("SELECT name FROM assembly.nation WHERE alive = 1 AND name LIKE ? LIMIT 0, 50");
			select.setString(1, start.toLowerCase().replaceAll(" ", "_") + "%");
			ResultSet result = select.executeQuery();
			while(result.next()) {
				nations.add(WordUtils.capitalizeFully(result.getString(1).replaceAll("_", " ")));
			}
			DbUtils.closeQuietly(result);
			DbUtils.closeQuietly(select);
		} finally {
			DbUtils.closeQuietly(conn);
		}
		
		Result result = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(nations.hashCode()));
		if (result != null) {
			return result;
		}
		return ok(Json.toJson(nations)).as("application/json");
	}

	public Result getFullName(String nation) throws SQLException {
		if (nation == null || nation.length() < 1) {
			Utils.handleDefaultGetHeaders(request(), response(), null);
			return Results.badRequest();
		}
		
		Map<String, String> json = new HashMap<String, String>(1);
		Connection conn = null;
		try {
			conn = getConnection();
			PreparedStatement select = conn.prepareStatement("SELECT full_name FROM assembly.nation WHERE name = ?");
			select.setString(1, Utils.sanitizeName(nation));
			ResultSet result = select.executeQuery();
			if (result.next()) {
				json.put(nation, result.getString(1));
			}
			DbUtils.closeQuietly(result);
			DbUtils.closeQuietly(select);
		} finally {
			DbUtils.closeQuietly(conn);
		}
		
		Result result = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(json.hashCode()));
		if (result != null) {
			return result;
		}
		return ok(Json.toJson(json)).as("application/json");
	}

	public Result getTitle(String nation) throws SQLException {
		if (nation == null || nation.length() < 1) {
			Utils.handleDefaultGetHeaders(request(), response(), null);
			return Results.badRequest();
		}
		
		Map<String, String> json = new HashMap<String, String>(1);
		Connection conn = null;
		try {
			conn = getConnection();
			PreparedStatement select = conn.prepareStatement("SELECT title FROM assembly.nation WHERE name = ?");
			select.setString(1, Utils.sanitizeName(nation));
			ResultSet result = select.executeQuery();
			if (result.next()) {
				json.put(nation, result.getString(1));
			}
			DbUtils.closeQuietly(result);
			DbUtils.closeQuietly(select);
		} finally {
			DbUtils.closeQuietly(conn);
		}
		
		Result result = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(json.hashCode()));
		if (result != null) {
			return result;
		}
		return ok(Json.toJson(json)).as("application/json");
	}
}
