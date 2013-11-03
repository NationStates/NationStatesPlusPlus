package controllers;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.apache.commons.dbutils.DbUtils;
import org.apache.commons.math3.stat.descriptive.SummaryStatistics;
import org.codehaus.jackson.annotate.JsonProperty;
import org.joda.time.Duration;
import org.spout.cereal.config.yaml.YamlConfiguration;

import play.libs.Json;
import play.mvc.Result;
import play.mvc.Results;

import com.afforess.assembly.util.DatabaseAccess;
import com.afforess.assembly.util.Utils;

public class RegionController extends DatabaseController {

	public RegionController(DatabaseAccess access, YamlConfiguration config) {
		super(access, config);
	}

	public Result getUpdateTime(String region) throws SQLException, ExecutionException {
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
			SummaryStatistics minor = new SummaryStatistics();
			SummaryStatistics major = new SummaryStatistics();
			while(times.next()) {
				if (times.getInt(2) == 1) 
					major.addValue(times.getLong(1));
				else
					minor.addValue(times.getLong(1));
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

	public Result getNations(String region) throws SQLException, ExecutionException {
		List<String> nations = new ArrayList<String>();
		Connection conn = null; 
		try {
			conn = getConnection();
			PreparedStatement statement = conn.prepareStatement("SELECT name FROM assembly.nation WHERE alive = 1 AND region = ?");
			statement.setInt(1, getDatabase().getRegionIdCache().get(Utils.sanitizeName(region)));
			ResultSet result = statement.executeQuery();
			while(result.next()) {
				nations.add(result.getString(1));
			}
		} finally {
			DbUtils.closeQuietly(conn);
		}

		Result result = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(nations.hashCode()), "360");
		if (result != null) {
			return result;
		}
		return ok(Json.toJson(nations)).as("application/json");
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

			PreparedStatement global = conn.prepareStatement("CALL assembly.first_seen_history(30)");
			result = global.executeQuery();
			population = new ArrayList<Population>();
			while(result.next()) {
				population.add(new Population(result.getInt(1), result.getLong(2)));
			}
			data.put("global_growth", population);

			global = conn.prepareStatement("CALL assembly.cte_history(30)");
			result = global.executeQuery();
			population = new ArrayList<Population>();
			while(result.next()) {
				population.add(new Population(result.getInt(1), result.getLong(2)));
			}
			data.put("global_cte", population);

			global = conn.prepareStatement("SELECT count(id) FROM assembly.nation WHERE alive = 1;");
			result = global.executeQuery();
			result.next();
			data.put("global_alive", result.getInt(1));
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
}
