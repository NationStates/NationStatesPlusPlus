package controllers;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import java.util.concurrent.ExecutionException;

import org.apache.commons.dbutils.DbUtils;
import org.apache.commons.math3.stat.descriptive.SummaryStatistics;
import org.codehaus.jackson.annotate.JsonProperty;
import org.joda.time.Duration;
import org.spout.cereal.config.ConfigurationNode;
import org.spout.cereal.config.yaml.YamlConfiguration;

import play.Logger;
import play.libs.Json;
import play.mvc.Result;
import play.mvc.Results;

import com.afforess.assembly.util.DatabaseAccess;
import com.afforess.assembly.util.Utils;
import com.limewoodMedia.nsapi.NationStates;

public class RegionController extends NationStatesController {
	private final String imgurClientKey;
	public RegionController(DatabaseAccess access, YamlConfiguration config, NationStates api) {
		super(access, config, api);
		ConfigurationNode imgurAuth = getConfig().getChild("imgur");
		imgurClientKey = imgurAuth.getChild("client-key").getString(null);
	}

	public Result getUpdateTime(String region, int std) throws SQLException, ExecutionException {
		Connection conn = null; 
		final int regionId = getDatabase().getRegionIdCache().get(Utils.sanitizeName(region));
		if (regionId == -1) {
			return Results.badRequest();
		}
		try {
			conn = getConnection();
			PreparedStatement updateTime = conn.prepareStatement("SELECT normalized_start, major FROM assembly.region_update_calculations WHERE region = ? AND update_time < 200000 ORDER BY start DESC LIMIT 0, 60");
			updateTime.setInt(1, regionId);
			ResultSet times = updateTime.executeQuery();
			List<Long> majorData = new ArrayList<Long>(30);
			List<Long> minorData = new ArrayList<Long>(30);
			SummaryStatistics minor = new SummaryStatistics();
			SummaryStatistics major = new SummaryStatistics();
			while(times.next()) {
				if (times.getInt(2) == 1) {
					major.addValue(times.getLong(1));
					majorData.add(times.getLong(1));
				} else {
					minor.addValue(times.getLong(1));
					minorData.add(times.getLong(1));
				}
			}
			DbUtils.closeQuietly(times);
			DbUtils.closeQuietly(updateTime);
			
			if (std > 0) {
				//Check for major update outliers
				Set<Long> outliers = new HashSet<Long>();
				for (Long time : majorData) {
					if (time.longValue() > (major.getMean() + major.getStandardDeviation() * std)) {
						outliers.add(time);
					}
				}
				if (outliers.size() > 0) {
					major.clear();
					for (Long time : majorData) {
						if (!outliers.contains(time)) {
							major.addValue(time);
						}
					}
				}
				
				outliers.clear();
				//Check for minor update outliers
				for (Long time : minorData) {
					if (time.longValue() > (minor.getMean() + minor.getStandardDeviation() * std)) {
						outliers.add(time);
					}
				}
				if (outliers.size() > 0) {
					minor.clear();
					for (Long time : minorData) {
						if (!outliers.contains(time)) {
							minor.addValue(time);
						}
					}
				}
			}
			
			Map<String, Object> data = new HashMap<String, Object>();
			Map<String, Long> majorUpdate = new HashMap<String, Long>();
			majorUpdate.put("mean", Double.valueOf(major.getMean()).longValue());
			majorUpdate.put("std", Double.valueOf(major.getStandardDeviation()).longValue());
			majorUpdate.put("max", Double.valueOf(major.getMax()).longValue());
			majorUpdate.put("min", Double.valueOf(major.getMin()).longValue());
			majorUpdate.put("geomean", Double.valueOf(major.getGeometricMean()).longValue());
			majorUpdate.put("variance", Double.valueOf(major.getVariance()).longValue());
			data.put("major", majorUpdate);
			
			Map<String, Long> minorUpdate = new HashMap<String, Long>();
			minorUpdate.put("mean", Double.valueOf(minor.getMean()).longValue());
			minorUpdate.put("std", Double.valueOf(minor.getStandardDeviation()).longValue());
			minorUpdate.put("max", Double.valueOf(minor.getMax()).longValue());
			minorUpdate.put("min", Double.valueOf(minor.getMin()).longValue());
			minorUpdate.put("geomean", Double.valueOf(minor.getGeometricMean()).longValue());
			minorUpdate.put("variance", Double.valueOf(minor.getVariance()).longValue());
			data.put("minor", minorUpdate);

			Result result = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(data.hashCode()), "60");
			if (result != null) {
				return result;
			}
			return ok(Json.toJson(data)).as("application/json");
		} finally {
			DbUtils.closeQuietly(conn);
		}
	}

	public Result getNations(String regions, boolean xml) throws SQLException, ExecutionException {
		Map<String, Object> regionData = new LinkedHashMap<String, Object>();
		Connection conn = null; 
		try {
			conn = getConnection();
			String[] split = regions.split(",");
			for (int i = 0; i < split.length; i++) {
				List<String> nations = new ArrayList<String>();
				PreparedStatement statement = conn.prepareStatement("SELECT name FROM assembly.nation WHERE alive = 1 AND region = ? ORDER BY update_order ASC");
				statement.setInt(1, getDatabase().getRegionIdCache().get(Utils.sanitizeName(split[i])));
				ResultSet result = statement.executeQuery();
				while(result.next()) {
					nations.add(result.getString(1));
				}
				Collections.reverse(nations);
				regionData.put(split[i], nations);
				DbUtils.closeQuietly(result);
				DbUtils.closeQuietly(statement);
			}
		} finally {
			DbUtils.closeQuietly(conn);
		}

		Utils.handleDefaultPostHeaders(request(), response());
		if (xml) {
			String data = "<REGIONS>\n\t";
			for (Entry<String, Object> e : regionData.entrySet()) {
				data += "<REGION id=\"" + e.getKey() + "\">\n\t\t<NATIONS>";
				@SuppressWarnings("unchecked")
				List<String> nations = (List<String>) e.getValue();
				StringBuilder b = new StringBuilder();
				int chunk = 0;
				for (String nation : nations) {
					if (b.length() / 30000 != chunk) {
						chunk++;
						b.append("</NATIONS><NATIONS>");
					} else if (b.length() > 0) {
						b.append(":");
					}
					b.append(nation);
				}
				b.append("</NATIONS>\n\t</REGION>");
				data += b.toString();
			}
			data += "\n</REGIONS>";
			return ok(data).as("application/xml");
		} else {
			return ok(Json.toJson(regionData.size() == 1 ? regionData.get(regions.split(",")[0]) : regionData)).as("application/json");
		}
	}

	public Result getPopulationTrends(String region) throws SQLException, ExecutionException {
		Map<String, Object> data = new HashMap<String, Object>(4);
		Connection conn = null; 
		try {
			conn = getConnection();
			PreparedStatement statement = conn.prepareStatement("SELECT population, timestamp FROM assembly.region_populations WHERE region = ? AND timestamp > ? ORDER BY TIMESTAMP DESC");
			statement.setString(1, Utils.sanitizeName(region));
			statement.setLong(2, System.currentTimeMillis() - Duration.standardDays(30).getMillis());
			ResultSet result = statement.executeQuery();
			List<Population> population = new ArrayList<Population>();
			while(result.next()) {
				population.add(new Population(result.getInt(1), result.getLong(2)));
			}
			data.put("region", population);
			
			DbUtils.closeQuietly(result);
			DbUtils.closeQuietly(statement);

			PreparedStatement global = conn.prepareStatement("CALL assembly.first_seen_history(30)");
			result = global.executeQuery();
			population = new ArrayList<Population>();
			while(result.next()) {
				population.add(new Population(result.getInt(1), result.getLong(2)));
			}
			data.put("global_growth", population);
			
			DbUtils.closeQuietly(result);
			DbUtils.closeQuietly(global);

			global = conn.prepareStatement("CALL assembly.cte_history(30)");
			result = global.executeQuery();
			population = new ArrayList<Population>();
			while(result.next()) {
				population.add(new Population(result.getInt(1), result.getLong(2)));
			}
			data.put("global_cte", population);
			
			DbUtils.closeQuietly(result);
			DbUtils.closeQuietly(global);

			global = conn.prepareStatement("SELECT count(id) FROM assembly.nation WHERE alive = 1;");
			result = global.executeQuery();
			result.next();
			data.put("global_alive", result.getInt(1));
			
			DbUtils.closeQuietly(result);
			DbUtils.closeQuietly(global);
		} finally {
			DbUtils.closeQuietly(conn);
		}

		Result result = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(data.hashCode()), "21600");
		if (result != null) {
			return result;
		}
		return ok(Json.toJson(data)).as("application/json");
	}

	static class Population {
		@JsonProperty
		int population;
		@JsonProperty
		long timestamp;
		Population() {
			
		}

		Population(int population, long timestamp) {
			this.population = population;
			this.timestamp = timestamp;
		}
	}

	public Result setRegionalMap(String region, boolean disband) throws SQLException, ExecutionException {
		Result ret = Utils.validateRequest(request(), response(), getAPI(), getDatabase());
		if (ret != null) {
			return ret;
		}
		String nation = Utils.sanitizeName(Utils.getPostValue(request(), "nation"));
		
		Utils.handleDefaultPostHeaders(request(), response());
		Connection conn = null;
		try {
			conn = getConnection();
			PreparedStatement select = conn.prepareStatement("SELECT delegate, founder FROM assembly.region WHERE name = ?");
			select.setString(1, Utils.sanitizeName(region));
			ResultSet result = select.executeQuery();
			boolean regionAdministrator = true;
			if (result.next()) {
				Logger.info("Attempting to set map for " + region + ", nation: " + nation);
				Logger.info("Delegate: " + result.getString(1) + " | Founder: " + result.getString(2));
				if (!nation.equals(result.getString(1)) && !nation.equals(result.getString(2))) {
					regionAdministrator = false;
				}
			} else {
				Logger.info("Attempting to set map for " + region + ", no region found!");
				regionAdministrator = false;
			}
			
			DbUtils.closeQuietly(result);
			DbUtils.closeQuietly(select);
			
			if (!regionAdministrator) {
				return Results.unauthorized();
			}
			
			if (disband) {
				PreparedStatement update = conn.prepareStatement("UPDATE assembly.region SET regional_map = NULL, regional_map_preview = NULL WHERE name = ?");
				update.setString(1, Utils.sanitizeName(region));
				update.executeUpdate();
				DbUtils.closeQuietly(update);
			} else {
				String mapLink = Utils.getPostValue(request(), "regional_map");
				String mapPreview = Utils.getPostValue(request(), "regional_map_preview");
				if (mapPreview == null) {
					return Results.badRequest("missing map preview");
				}
				if (mapLink == null) {
					return Results.badRequest("missing map link");
				}
				String imgurPreview = null;
				try {
					imgurPreview = Utils.uploadToImgur(mapPreview, imgurClientKey);
				} catch (Exception e) {
					Logger.warn("Unable to upload image to imgur for regional map [" + mapPreview + "]", e);
				}
				if (imgurPreview == null) {
					return Results.badRequest("invalid map preview");
				}
				PreparedStatement update = conn.prepareStatement("UPDATE assembly.region SET regional_map = ?, regional_map_preview = ? WHERE name = ?");
				update.setString(1, mapLink);
				update.setString(2, imgurPreview);
				update.setString(3, Utils.sanitizeName(region));
				update.executeUpdate();
				DbUtils.closeQuietly(update);
			}
		} finally {
			DbUtils.closeQuietly(conn);
		}
		return Results.ok();
	}

	public Result getRegionalMap(String region) throws SQLException, ExecutionException {
		Map<String, String> links = new HashMap<String, String>(3);
		Connection conn = null;
		try {
			conn = getConnection();
			PreparedStatement update = conn.prepareStatement("SELECT regional_map, regional_map_preview FROM assembly.region WHERE name = ?");
			update.setString(1, Utils.sanitizeName(region));
			ResultSet set = update.executeQuery();
			if (set.next()) {
				String mapLink = set.getString(1);
				if (!set.wasNull()) {
					links.put("regional_map", mapLink);
				}
				String mapPreview = set.getString(2);
				if (!set.wasNull()) {
					links.put("regional_map_preview", mapPreview);
				}
			}
			DbUtils.closeQuietly(set);
			DbUtils.closeQuietly(update);
		} finally {
			DbUtils.closeQuietly(conn);
		}
		Result result = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(links.hashCode()), "60");
		if (result != null) {
			return result;
		}
		return Results.ok(Json.toJson(links)).as("application/json");
	}


	public Result setRegionDelegateTitle(String region, boolean disband) throws SQLException, ExecutionException {
		Result ret = Utils.validateRequest(request(), response(), getAPI(), getDatabase());
		if (ret != null) {
			return ret;
		}
		String nation = Utils.sanitizeName(Utils.getPostValue(request(), "nation"));
		
		Utils.handleDefaultPostHeaders(request(), response());
		Connection conn = null;
		try {
			conn = getConnection();
			PreparedStatement select = conn.prepareStatement("SELECT delegate, founder FROM assembly.region WHERE name = ?");
			select.setString(1, Utils.sanitizeName(region));
			ResultSet result = select.executeQuery();
			boolean regionAdministrator = true;
			if (result.next()) {
				Logger.info("Attempting to set map for " + region + ", nation: " + nation);
				Logger.info("Delegate: " + result.getString(1) + " | Founder: " + result.getString(2));
				if (!nation.equals(result.getString(1)) && !nation.equals(result.getString(2))) {
					regionAdministrator = false;
				}
			} else {
				Logger.info("Attempting to set map for " + region + ", no region found!");
				regionAdministrator = false;
			}
			if (!regionAdministrator) {
				return Results.unauthorized();
			}
			
		} finally {
			DbUtils.closeQuietly(conn);
		}
		return Results.ok();
	}

	public Result getRegionalDelegateTitle(String region) throws SQLException, ExecutionException {
		
		return Results.ok(Json.toJson("")).as("application/json");
	}
}
