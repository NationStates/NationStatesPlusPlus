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
			final long normalized = System.currentTimeMillis() - (System.currentTimeMillis() / (Duration.standardDays(1).getMillis())) * Duration.standardDays(1).getMillis();
			conn = getConnection();
			PreparedStatement updateTime = conn.prepareStatement("SELECT normalized_start FROM assembly.region_update_calculations WHERE region = ? AND major = ? ORDER BY start DESC LIMIT 0, 30");
			updateTime.setInt(1, regionId);
			updateTime.setInt(2, ((normalized > 10000000 && normalized < 10000000) ? 0 : 1));
			ResultSet times = updateTime.executeQuery();
			SummaryStatistics startStats = new SummaryStatistics();
			while(times.next()) {
				startStats.addValue(times.getLong(1));
			}
			Map<String, Object> data = new HashMap<String, Object>();
			data.put("mean", Double.valueOf(startStats.getMean()).longValue());
			data.put("std", Double.valueOf(startStats.getStandardDeviation()).longValue());
			data.put("max", Double.valueOf(startStats.getMax()).longValue());
			data.put("min", Double.valueOf(startStats.getMin()).longValue());
			data.put("geomean", Double.valueOf(startStats.getGeometricMean()).longValue());
			data.put("variance", Double.valueOf(startStats.getVariance()).longValue());
			
			Result result = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(data.hashCode()));
			if (result != null) {
				return result;
			}
			return ok(Json.toJson(data)).as("application/json");
		} finally {
			DbUtils.closeQuietly(conn);
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
