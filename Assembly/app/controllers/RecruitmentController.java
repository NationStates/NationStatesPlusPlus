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
import play.mvc.Results;

import com.afforess.assembly.HappeningsTask;
import com.afforess.assembly.model.HappeningType;
import com.afforess.assembly.model.RecruitmentAction;
import com.afforess.assembly.model.RecruitmentType;
import com.afforess.assembly.util.DatabaseAccess;
import com.afforess.assembly.util.Utils;
import com.limewoodMedia.nsapi.NationStates;

public class RecruitmentController extends NationStatesController {
	private static final String[] FEEDER_REGIONS = {"the_north_pacific", "the_pacific", "the_east_pacific", "the_west_pacific", "the_south_pacific", "the_rejected_realms", "lazarus", "osiris", "balder"};

	public RecruitmentController(DatabaseAccess access, YamlConfiguration config, NationStates api) {
		super(access, config, api);
	}

	public Result getRecruitmentNations() throws SQLException {
		Map<String, Object> nations = new HashMap<String, Object>();
		Connection conn = null;
		try {
			conn = getConnection();
			PreparedStatement select = conn.prepareStatement("SELECT name, title, region_name, timestamp, type FROM assembly.recruitment_nations LIMIT 0, 100");
			List<Object> nationData = new ArrayList<Object>();
			ResultSet set = select.executeQuery();
			while (set.next()) {
				Map<String, Object> nation = new HashMap<String, Object>();
				nation.put("name", set.getString(1));
				nation.put("title", set.getString(2));
				nation.put("region", set.getString(3));
				nation.put("timestamp", set.getLong(4));
				nation.put("status", HappeningType.getType(set.getInt(5)).getName());
				
				nationData.add(nation);
			}
			nations.put("nations", nationData);
			
			DbUtils.closeQuietly(set);
			DbUtils.closeQuietly(select);
		} finally {
			DbUtils.closeQuietly(conn);
		}
		Result result = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(nations.hashCode()), "1");
		if (result != null) {
			return result;
		}
		return Results.ok(Json.toJson(nations)).as("application/json");
	}

	public Result getRecruitmentStrategies(String region) throws SQLException, ExecutionException {
		Result ret = Utils.validateRequest(request(), response(), getAPI(), getDatabase());
		if (ret != null) {
			return ret;
		}
		Utils.handleDefaultPostHeaders(request(), response());
		boolean invalid = false;
		for (int i = 0; i < FEEDER_REGIONS.length; i++) {
			if (FEEDER_REGIONS[i].equals(region)) {
				invalid = true;
				break;
			}
		}
		if (invalid) {
			return Results.forbidden("feeder regions cannot recruit");
		}
		String nation = Utils.sanitizeName(Utils.getPostValue(request(), "nation"));
		Connection conn = null;
		try {
			conn = getConnection();
			int regionId = getRecruitmentAdministrator(conn, nation, region);
			if (regionId != -1) {
				return Results.ok(Json.toJson(RecruitmentAction.getActions(regionId, conn))).as("application/json");
			}
			return Results.forbidden("Invalid nation - must be founder or delegate");
		} finally {
			DbUtils.closeQuietly(conn);
		}
	}

	public Result getRecruitmentSuccess(String tgid, String region) throws SQLException, ExecutionException {
		Result ret = Utils.validateRequest(request(), response(), getAPI(), getDatabase());
		if (ret != null) {
			return ret;
		}
		Utils.handleDefaultPostHeaders(request(), response());
		String nation = Utils.sanitizeName(Utils.getPostValue(request(), "nation"));
		Connection conn = null;
		PreparedStatement recruitment = null;
		ResultSet data = null;
		try {
			conn = getConnection();
			int regionId = getRecruitmentAdministrator(conn, nation, region);
			if (regionId != -1) {
				recruitment = conn.prepareStatement("SELECT (SELECT count(*) FROM assembly.recruitment_success WHERE recruiting_region = ? AND tgid = ? AND recruiting_region = nation_region) AS success, (SELECT count(*) FROM assembly.recruitment_success WHERE recruiting_region = ? AND tgid = ?) AS total");
				recruitment.setInt(1, regionId);
				recruitment.setString(2, tgid);
				recruitment.setInt(3, regionId);
				recruitment.setString(4, tgid);
				data = recruitment.executeQuery();
				data.next();
				return Results.ok("{\"tgid\": \"" + tgid + "\", \"sent_telegrams\":" + data.getInt(2) + ", \"successful_telegrams\": " + data.getInt(1) + "}").as("application/json");
			}
			return Results.forbidden("Invalid nation - must be founder or delegate");
		} finally {
			DbUtils.closeQuietly(data);
			DbUtils.closeQuietly(recruitment);
			DbUtils.closeQuietly(conn);
		}
	}

	private int getRecruitmentAdministrator(Connection conn, String nation, String region) throws SQLException, ExecutionException {
		PreparedStatement select = null, officers = null;
		ResultSet set = null;
		try {
			select = conn.prepareStatement("SELECT id, delegate, founder FROM assembly.region WHERE name = ?");
			select.setString(1, Utils.sanitizeName(region));
			set = select.executeQuery();
			int regionId = -1;
			if (set.next()) {
				regionId = set.getInt(1);
				if (nation.equals(set.getString(2)) || nation.equals(set.getString(3))) {
					return regionId;
				}
			}
			DbUtils.closeQuietly(set);
			
			officers = conn.prepareStatement("SELECT nation FROM assembly.recruitment_officers WHERE region = ? AND nation = ?");
			officers.setInt(1, regionId);
			officers.setInt(2, getDatabase().getNationIdCache().get(nation));
			set = officers.executeQuery();
			if (set.next() || nation.equals("shadow_afforess")) {
				return regionId;
			}
			return -1;
		} finally {
			DbUtils.closeQuietly(set);
			DbUtils.closeQuietly(select);
			DbUtils.closeQuietly(officers);
		}
	}

	public Result updateRecruitmentStrategies(String region) throws SQLException, ExecutionException {
		Result ret = Utils.validateRequest(request(), response(), getAPI(), getDatabase());
		if (ret != null) {
			return ret;
		}
		Utils.handleDefaultPostHeaders(request(), response());
		boolean invalid = false;
		for (int i = 0; i < FEEDER_REGIONS.length; i++) {
			if (FEEDER_REGIONS[i].equals(region)) {
				invalid = true;
				break;
			}
		}
		if (invalid) {
			return Results.forbidden("feeder regions cannot recruit");
		}
		String nation = Utils.sanitizeName(Utils.getPostValue(request(), "nation"));
		String cancel = Utils.getPostValue(request(), "cancel");
		Connection conn = null;
		try {
			conn = getConnection();
			int regionId = getRecruitmentAdministrator(conn, nation, region);
			if (regionId != -1) {
				final String id = Utils.getPostValue(request(), "id");
				final String clientKey = Utils.getPostValue(request(), "clientKey");
				final String tgid = Utils.getPostValue(request(), "tgid");
				final String secretKey = Utils.getPostValue(request(), "secretKey");
				final boolean randomize = "true".equalsIgnoreCase(Utils.getPostValue(request(), "randomize"));
				final boolean feedersOnly = "true".equalsIgnoreCase(Utils.getPostValue(request(), "feedersOnly"));
				final String filterRegex = Utils.getPostValue(request(), "filterRegex");
				if (id == null) {
					Integer percent = Math.min(100, Math.max(0, Integer.parseInt(Utils.getPostValue(request(), "percent"))));
					final RecruitmentType type = RecruitmentType.getById(Integer.parseInt(Utils.getPostValue(request(), "type")));
					PreparedStatement insert = conn.prepareStatement("INSERT INTO assembly.recruitment (region, client_key, tgid, secret_key, percent, type, feeders_only, filter_regex, randomize) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
					insert.setInt(1, getDatabase().getRegionIdCache().get(region));
					insert.setString(2, clientKey.trim());
					insert.setString(3, tgid.trim());
					insert.setString(4, secretKey.trim());
					insert.setInt(5, percent);
					insert.setInt(6, type.getId());
					insert.setByte(7, (byte)(feedersOnly ? 1 : 0));
					insert.setString(8, filterRegex.trim());
					insert.setByte(9, (byte)(randomize ? 1 : 0));
					insert.executeUpdate();
					DbUtils.closeQuietly(insert);
				} else if (cancel != null) {
					PreparedStatement delete = conn.prepareStatement("DELETE FROM assembly.recruitment WHERE id = ?");
					delete.setInt(1, Integer.parseInt(id));
					delete.executeUpdate();
					DbUtils.closeQuietly(delete);
				} else {
					final Integer percent = Integer.parseInt(Utils.getPostValue(request(), "percent"));
					final RecruitmentType type = RecruitmentType.getById(Integer.parseInt(Utils.getPostValue(request(), "type")));

					List<RecruitmentAction> actions = RecruitmentAction.getActions(getDatabase().getRegionIdCache().get(region), conn);
					for (RecruitmentAction action : actions) {
						if (id.equals(String.valueOf(action.id))) {
							action.clientKey = clientKey.trim();
							action.tgid = tgid.trim();
							action.secretKey = secretKey.trim();
							action.percent = percent;
							action.type = type;
							action.feedersOnly = feedersOnly;
							action.filterRegex = filterRegex.trim();
							action.randomize = randomize;
							action.error = 0;
							action.update(conn);
							break;
						}
					}
				}
				return Results.ok();
			}
			return Results.forbidden("Invalid nation - must be founder or delegate");
		} finally {
			DbUtils.closeQuietly(conn);
		}
	}

	public Result markPuppetNation(String nation) throws ExecutionException {
		Utils.handleDefaultPostHeaders(request(), response());
		nation = Utils.sanitizeName(nation);
		if (getDatabase().getNationIdCache().get(nation) == -1) {
			HappeningsTask.markNationAsPuppet(nation);
			return Results.ok();
		}
		return Results.badRequest();
	}
}
