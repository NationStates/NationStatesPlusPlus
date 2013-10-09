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
import org.codehaus.jackson.annotate.JsonProperty;
import org.joda.time.Duration;
import org.spout.cereal.config.yaml.YamlConfiguration;

import play.libs.Json;
import play.mvc.Result;

import com.afforess.assembly.util.DatabaseAccess;
import com.afforess.assembly.util.Utils;

public class RegionController extends DatabaseController {

	public RegionController(DatabaseAccess access, YamlConfiguration config) {
		super(access, config);
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
