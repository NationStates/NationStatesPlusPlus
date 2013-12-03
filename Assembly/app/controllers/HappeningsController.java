package controllers;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.concurrent.ExecutionException;

import org.apache.commons.dbutils.DbUtils;
import org.apache.commons.io.IOUtils;
import org.codehaus.jackson.annotate.JsonProperty;
import org.spout.cereal.config.yaml.YamlConfiguration;

import play.Logger;
import play.libs.Json;
import play.mvc.Result;
import play.mvc.Results;

import com.afforess.assembly.util.DatabaseAccess;
import com.afforess.assembly.util.Utils;
import com.limewoodMedia.nsapi.NationStates;
import com.limewoodMedia.nsapi.holders.RegionData;
import com.limewoodMedia.nsapi.holders.RegionHappening;

public class HappeningsController extends DatabaseController {

	public HappeningsController(DatabaseAccess access, YamlConfiguration config) {
		super(access, config);
	}

	public Result parseHappenings() throws SQLException {
		String region = Utils.getPostValue(request(), "region");
		String xml = Utils.getPostValue(request(), "xml");
		if (region != null && xml != null) {
			return doParseHappenings(region, xml);
		}
		return Results.status(BAD_REQUEST);
	}

	public Result regionHappenings(String region, int start) throws SQLException, ExecutionException {
		start = Math.max(0, start);
		int regionId = getDatabase().getRegionIdCache().get(Utils.sanitizeName(region));
		if (regionId == -1) {
			Utils.handleDefaultPostHeaders(request(), response());
			return Results.noContent();
		}
		ArrayList<HappeningData> happenings = new ArrayList<HappeningData>();
		Connection conn = null;
		try {
			conn = getConnection();
			PreparedStatement statement = conn.prepareStatement("SELECT happening, timestamp FROM assembly.regional_happenings_time WHERE region = ?  ORDER BY timestamp DESC LIMIT " + start + ", 20");
			statement.setInt(1, regionId);
			ResultSet result = statement.executeQuery();
			while(result.next()) {
				final String happening = Utils.formatHappeningText(result.getString(1), conn, "");
				HappeningData data = new HappeningData();
				data.happening = happening;
				data.timestamp = result.getLong(2);
				happenings.add(data);
			}
			DbUtils.closeQuietly(result);
			DbUtils.closeQuietly(statement);
		} finally {
			DbUtils.closeQuietly(conn);
		}
		
		String calculatedEtag = String.valueOf(happenings.hashCode());
		Result result = Utils.handleDefaultGetHeaders(request(), response(), calculatedEtag);
		if (happenings.isEmpty()) {
			HappeningData data = new HappeningData();
			data.happening = "Unknown region: " + region;
			data.timestamp = System.currentTimeMillis() / 1000;
			happenings.add(data);
		} else if (result != null) {
			return result;
		}

		return ok(Json.toJson(happenings)).as("application/json");
	}

	private Result doParseHappenings(String region, String xml) throws SQLException {
		NationStates api = new NationStates();
		Connection conn = null;
		ArrayList<HappeningData> happenings = new ArrayList<HappeningData>();
		try {
			RegionData regionData = api.getRegionInfo(api.getInfo(IOUtils.toInputStream(xml)), region);
			conn = getConnection();
			for (RegionHappening happening : regionData.happenings) {
				String text = Utils.formatHappeningText(happening.text, conn, "");
				HappeningData data = new HappeningData();
				data.happening = text;
				data.timestamp = happening.timestamp;
				happenings.add(data);
			}
		} catch (Exception e) {
			Logger.error("Unable to parse happenings for region [" + region + "]. Data: " + xml, e);
			return Results.status(INTERNAL_SERVER_ERROR);
		} finally {
			DbUtils.closeQuietly(conn);
		}
		
		String calculatedEtag = String.valueOf(happenings.hashCode());
		Result result = Utils.handleDefaultGetHeaders(request(), response(), calculatedEtag);

		if (happenings.isEmpty()) {
			return Results.noContent();
		} else	if (result != null) {
			return result;
		}

		return ok(Json.toJson(happenings)).as("application/json");
	}

	public Result nationHappenings(String nation, int start) throws SQLException, ExecutionException {
		start = Math.max(0, start);
		ArrayList<HappeningData> happenings = new ArrayList<HappeningData>();
		if (nation != null && nation.length() > 0) {
			int nationId = getDatabase().getNationIdCache().get(nation);
			if (nationId == -1) {
				Utils.handleDefaultPostHeaders(request(), response());
				return Results.noContent();
			}
			
			Connection conn = null;
			try {
				conn = getConnection();
				PreparedStatement statement = conn.prepareStatement("SELECT happening, timestamp FROM assembly.global_happenings WHERE visible = 1 AND nation = ?  ORDER BY timestamp DESC LIMIT " + start + ", 20");
				statement.setInt(1, getDatabase().getNationIdCache().get(nation));
				ResultSet result = statement.executeQuery();
				while(result.next()) {
					final String happening = Utils.formatHappeningText(result.getString(1), conn, nation);
					HappeningData data = new HappeningData();
					data.happening = happening;
					data.timestamp = result.getLong(2);
					happenings.add(data);
				}
				
				DbUtils.closeQuietly(result);
				DbUtils.closeQuietly(statement);
			} finally {
				DbUtils.closeQuietly(conn);
			}
		}
		String calculatedEtag = String.valueOf(happenings.hashCode());
		Result result = Utils.handleDefaultGetHeaders(request(), response(), calculatedEtag);

		if (happenings.isEmpty()) {
			return Results.noContent();
		} else	if (result != null) {
			return result;
		}

		return ok(Json.toJson(happenings)).as("application/json");
	}

	private static class HappeningData {
		@JsonProperty
		String happening;
		@JsonProperty
		long timestamp;
	}

}
