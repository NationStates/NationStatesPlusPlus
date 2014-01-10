package controllers;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;
import org.apache.commons.dbutils.DbUtils;
import org.spout.cereal.config.yaml.YamlConfiguration;

import com.afforess.assembly.util.DatabaseAccess;
import com.afforess.assembly.util.Utils;

import play.mvc.*;
import play.libs.Json;

public class FlagController extends DatabaseController {
	public FlagController(DatabaseAccess access, YamlConfiguration config) {
		super(access, config);
	}

	public Result redirectToNationFlag(String nation) throws SQLException {
		Connection conn = null;
		try {
			conn = getConnection();
			final String flag = Utils.getNationFlag(nation, conn, null);
			if (flag != null) {
				Result result = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(flag.hashCode()), "3600");
				if (result == null) {
					return Results.redirect(flag);
				}
				return result;
			}
			Utils.handleDefaultPostHeaders(request(), response());
			return Results.notFound();
		} finally {
			DbUtils.closeQuietly(conn);
		}
	}

	public Result redirectToRegionFlag(String region) throws SQLException {
		Connection conn = null;
		try {
			conn = getConnection();
			final String flag = Utils.getRegionFlag(region, conn, null);
			if (flag != null) {
				Result result = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(flag.hashCode()), "21600");
				if (result == null) {
					return Results.redirect(flag);
				}
				return result;
			}
			Utils.handleDefaultPostHeaders(request(), response());
			return Results.notFound();
		} finally {
			DbUtils.closeQuietly(conn);
		}
	}

	public Result nationFlags(String nations) throws SQLException {
		String[] nationNames = nations.split(",");
		Map<String, String> json = new HashMap<String, String>(nationNames.length);
		Connection conn = null;
		try {
			conn = getConnection();
			for (String nation : nationNames) {
				json.put(nation, Utils.getNationFlag(nation, conn));
			}
		} finally {
			DbUtils.closeQuietly(conn);
		}

		Result result = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(json.hashCode()), "21600");
		if (result != null) {
			return result;
		}
		return ok(Json.toJson(json)).as("application/json");
	}

	public Result regionFlags(String regions) throws SQLException {
		String[] regionNames = regions.split(",");
		Map<String, String> json = new HashMap<String, String>(regionNames.length);
		Connection conn = null;
		try {
			conn = getConnection();
			for (String region : regionNames) {
				json.put(region, Utils.getRegionFlag(region, conn));
			}
		} finally {
			DbUtils.closeQuietly(conn);
		}
		Result result = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(json.hashCode()), "3600");
		if (result != null) {
			return result;
		}
		return ok(Json.toJson(json)).as("application/json");
	}
}
