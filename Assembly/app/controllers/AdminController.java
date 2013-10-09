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

import com.afforess.assembly.model.HappeningType;
import com.afforess.assembly.util.DatabaseAccess;
import com.afforess.assembly.util.Utils;

public class AdminController extends DatabaseController {
	private final String adminCode;
	public AdminController(DatabaseAccess access, YamlConfiguration config) {
		super(access, config);
		adminCode = config.getChild("admin").getChild("code").getString();
	}

	public Result recalculateHappenings(String code) throws SQLException {
		if (!code.equals(adminCode)) {
			return Results.badRequest();
		}
		int updated = 0;
		int total = 0;
		Connection conn = null;
		try {
			conn = getConnection();
			PreparedStatement update = conn.prepareStatement("UPDATE assembly.global_happenings SET type = ? WHERE id = ?");
			PreparedStatement select = conn.prepareStatement("SELECT id, happening FROM assembly.global_happenings WHERE type = -1");
			ResultSet result = select.executeQuery();
			while(result.next()) {
				total++;
				int type = HappeningType.match(result.getString(2));
				if (type > -1) {
					update.setInt(1, type);
					update.setInt(2, result.getInt(1));
					update.addBatch();
					updated++;
				}
			}
			update.executeBatch();
		} finally {
			DbUtils.closeQuietly(conn);
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
}
