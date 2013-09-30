package controllers;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;

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
	
	public Result retrieveHappenings(String region, int start) throws SQLException {
		start = Math.max(0, start);
		ArrayList<HappeningData> happenings = new ArrayList<HappeningData>();
		long time = System.nanoTime();
		Connection conn = getConnection();
		try {
			PreparedStatement statement = conn.prepareStatement("SELECT happening, timestamp FROM assembly.region_happenings WHERE region = ?  ORDER BY timestamp DESC LIMIT " + start + ", 20");
			statement.setString(1, region);
			ResultSet result = statement.executeQuery();
			
			while(result.next()) {
				final String happening = Utils.formatHappeningText(result.getString(1), conn, true, "");
				HappeningData data = new HappeningData();
				data.happening = happening;
				data.timestamp = result.getLong(2);
				happenings.add(data);
			}
		} finally {
			DbUtils.closeQuietly(conn);
		}
		
		String calculatedEtag = String.valueOf(happenings.hashCode());
		Result result = Utils.handleDefaultGetHeaders(request(), response(), calculatedEtag);
		
		Logger.info("Time to retrieve happenings for region [" + region + "] was: " + (System.currentTimeMillis() - time) + " ms");
		
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
		final long start = System.nanoTime();
		try {
			RegionData regionData = api.getRegionInfo(api.getInfo(IOUtils.toInputStream(xml)), region);
			conn = getConnection();
			for (RegionHappening happening : regionData.happenings) {
				String text = Utils.formatHappeningText(happening.text, conn, true, "");
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

		Logger.info("Time to parse happenings for region [" + region + "] was: " + (System.nanoTime() - start) / 1E6D + " ms");
		
		if (happenings.isEmpty()) {
			HappeningData data = new HappeningData();
			data.happening = "Unknown region: " + region;
			data.timestamp = System.currentTimeMillis() / 1000;
			happenings.add(data);
		} else	if (result != null) {
			return result;
		}

		return ok(Json.toJson(happenings)).as("application/json");
	}

	public Result happenings(String nation, boolean global, boolean excludeNewest, int start, int limit) throws SQLException {
		if (excludeNewest) start = 10;
		if (limit <= 0 && start > 0) {
			limit = Integer.MAX_VALUE;
		}
		ArrayList<HappeningData> happenings = new ArrayList<HappeningData>();
		if (nation != null && nation.length() > 0) {
			long time = System.nanoTime();
			Connection conn = getConnection();
			try {
				PreparedStatement statement = conn.prepareStatement("SELECT happening, timestamp FROM " + (global ? "assembly.global_happenings" : "assembly.nation_happenings") + " WHERE nation = ?  ORDER BY timestamp DESC" + (limit > 0 ? " LIMIT " + start + ", " + limit : ""));
				statement.setString(1, nation);
				ResultSet result = statement.executeQuery();
				
				while(result.next()) {
					final String happening = Utils.formatHappeningText(result.getString(1), conn, global, nation);
					HappeningData data = new HappeningData();
					data.happening = happening;
					data.timestamp = result.getLong(2);
					happenings.add(data);
				}
			} finally {
				DbUtils.closeQuietly(conn);
			}
			Logger.info("Query time for all [" + nation + "] happenings: " + (System.nanoTime() - time) / 1E6D + " ms");
		}
		String calculatedEtag = String.valueOf(happenings.hashCode());
		Result result = Utils.handleDefaultGetHeaders(request(), response(), calculatedEtag);

		if (happenings.isEmpty()) {
			HappeningData data = new HappeningData();
			data.happening = "Unknown nation: " + nation;
			data.timestamp = System.currentTimeMillis() / 1000;
			happenings.add(data);
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
