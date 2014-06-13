package controllers;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

import org.apache.commons.dbutils.DbUtils;
import org.spout.cereal.config.yaml.YamlConfiguration;

import play.libs.Json;
import play.mvc.Result;
import play.mvc.Results;

import com.afforess.assembly.HappeningsTask;
import com.afforess.assembly.HealthMonitor;
import com.afforess.assembly.model.HappeningType;
import com.afforess.assembly.util.DatabaseAccess;
import com.afforess.assembly.util.Utils;

public class AdminController extends DatabaseController {
	private final String adminCode;
	private final HealthMonitor health;
	public AdminController(DatabaseAccess access, YamlConfiguration config, HealthMonitor health) {
		super(access, config);
		this.health = health;
		adminCode = config.getChild("admin").getChild("code").getString();
	}

	public Result recalculateHappenings(String code, int happeningType) throws SQLException, InterruptedException {
		if (!code.equals(adminCode)) {
			return Results.badRequest();
		}
		int updated = 0;
		int total = 0;
		while(true) {
			final int startId = total;
			Connection conn = null;
			try {
				conn = getConnection();
				
				HappeningType.initialize(conn);
				
				PreparedStatement update = conn.prepareStatement("UPDATE assembly.global_happenings SET type = ? WHERE id = ?");
				PreparedStatement select = conn.prepareStatement("SELECT id, happening, nation FROM assembly.global_happenings WHERE type = ? LIMIT 0, 1000");
				select.setInt(1, happeningType);
				ResultSet result = select.executeQuery();
				while(result.next()) {
					final int id = result.getInt(1);
					final String happenings = result.getString(2);
					total++;
					int type = HappeningType.match(happenings);
					if (type > -1) {
						update.setInt(1, type);
						update.setInt(2, id);
						update.executeUpdate();
						updated++;
						
						//Recalculate regional happenings
						HappeningType hType = HappeningType.getType(type);
						PreparedStatement deleteRegionHappenings = conn.prepareStatement("DELETE FROM assembly.regional_happenings WHERE global_id = ?");
						deleteRegionHappenings.setInt(1, id);
						deleteRegionHappenings.executeUpdate();
						HappeningsTask.updateRegionHappenings(conn, this.getDatabase(), result.getInt(3), id, happenings, hType);
					}
				}
			} finally {
				DbUtils.closeQuietly(conn);
			}
			if (total == startId) {
				break;
			}
			Thread.sleep(1000);
			for (int i = 0; i < 5; i++) { System.gc(); Thread.sleep(250); }
			Thread.sleep(1000);
		}
		
		Result result = Utils.handleDefaultGetHeaders(request(), response(), null);
		if (result != null) {
			return result;
		}
		Map<String, Object> map = new HashMap<String, Object>();
		map.put("updated", updated);
		map.put("total", total);
		return ok(Json.toJson(map)).as("application/json");
	}

	public Result invalidateCaches(String code) throws SQLException, InterruptedException {
		if (!code.equals(adminCode)) {
			return Results.badRequest();
		}
		health.invalidateCaches();
		return ok("All cache's invalidated");
	}

	public Result doRestart(String code) throws SQLException, InterruptedException {
		if (!code.equals(adminCode)) {
			return Results.badRequest();
		}
		health.doRestart();
		return ok("Restarting!");
	}
}
