package controllers;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.apache.commons.dbutils.DbUtils;
import org.joda.time.DateTime;
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
		Connection conn = getConnection();
		String flag;
		try {
			flag = Utils.getNationFlag(nation, conn);
			if (flag != null) {
				Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(flag.hashCode()));
				return Results.redirect(flag);
			}
		} finally {
			DbUtils.closeQuietly(conn);
		}
		Utils.handleDefaultPostHeaders(request(), response());
		return Results.redirect("http://www.nationstates.net/images/flags/uploads/rflags/notfound.png");
	}

	public Result redirectToRegionFlag(String region) throws ExecutionException {
		String flag = getDatabase().getRegionCache().get(Utils.sanitizeName(region));
		if (!flag.equals("http://www.nationstates.net/images/flags/Defaultt2.png")) {
			Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(flag.hashCode()));
			return Results.redirect(flag);
		}
		Utils.handleDefaultPostHeaders(request(), response());
		return Results.redirect("http://www.nationstates.net/images/flags/uploads/rflags/notfound.png");
	}

	public Result flag(String nation) throws SQLException {
		Map<String, String> json = new HashMap<String, String>(2);
		Connection conn = getConnection();
		String flag;
		try {
			flag = Utils.getNationFlag(nation, conn);
			if (flag != null) {
				json.put(nation, flag);
			} else {
				flag = "";
			}
		} finally {
			DbUtils.closeQuietly(conn);
		}

		Result result = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(flag.hashCode()));
		if (result != null) {
			return result;
		}
		return ok(Json.toJson(json)).as("application/json");
	}

	public Result regionFlag(String regions) throws ExecutionException {
		String eTag = request().getHeader("If-None-Match");
		String[] regionNames = regions.split(",");
		Map<String, String> json = new HashMap<String, String>(regionNames.length);
		for (String region : regionNames) {
			json.put(region, getDatabase().getRegionCache().get(Utils.sanitizeName(region)));
		}
		final String calculatedEtag = String.valueOf(json.hashCode());
		if (calculatedEtag.equals(eTag)) {
			return Results.status(304);
		}
		response().setHeader("Access-Control-Allow-Origin", "*");
		response().setHeader("Access-Control-Allow-Methods", "POST, GET, HEAD");
		response().setHeader("Access-Control-Max-Age", "3600");
		response().setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		response().setHeader("Cache-Control", "public, max-age=3600");
		response().setHeader("Expires", new DateTime().plusHours(1).toString(Utils.HTTP_DATE_TIME));
		response().setHeader("Last-Modified", new DateTime().plusHours(-1).toString(Utils.HTTP_DATE_TIME));
		response().setHeader("Vary", "Accept-Encoding");
		response().setHeader("ETag", calculatedEtag);
		return ok(Json.toJson(json)).as("application/json");
	}
}
