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
		List<Population> population = new ArrayList<Population>();
		Connection conn = null; 
		try {
			conn = getConnection();
			PreparedStatement statement = conn.prepareStatement("SELECT population, timestamp FROM assembly.region_populations WHERE region = ? ORDER BY TIMESTAMP DESC LIMIT 0, 30 ");
			statement.setString(1, Utils.sanitizeName(region));
			ResultSet result = statement.executeQuery();
			while(result.next()) {
				population.add(new Population(result.getInt(1), result.getLong(2)));
			}
			
			//for ()
			PreparedStatement global = conn.prepareStatement("SELECT count(id) FROM assembly.nation WHERE first_seen > ");
			statement.setString(1, Utils.sanitizeName(region));
			result = statement.executeQuery();
			while(result.next()) {
				population.add(new Population(result.getInt(1), result.getLong(2)));
			}
		} finally {
			DbUtils.closeQuietly(conn);
		}
		
		

		Result result = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(population.hashCode()));
		if (result != null) {
			return result;
		}
		return ok(Json.toJson(population)).as("application/json");
	}

	static class Population {
		int population;
		long timestamp;
		Population(int population, long timestamp) {
			this.population = population;
			this.timestamp = timestamp;
		}
	}
}
