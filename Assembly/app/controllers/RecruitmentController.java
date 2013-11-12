package controllers;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.concurrent.ExecutionException;

import org.apache.commons.dbutils.DbUtils;
import org.spout.cereal.config.yaml.YamlConfiguration;

import play.libs.Json;
import play.mvc.Result;
import play.mvc.Results;

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
			PreparedStatement select = conn.prepareStatement("SELECT id, delegate, founder FROM assembly.region WHERE name = ?");
			select.setString(1, Utils.sanitizeName(region));
			ResultSet set = select.executeQuery();
			if (set.next()) {
				if (nation.equals(set.getString(2)) || nation.equals(set.getString(3))) {
					return Results.ok(Json.toJson(RecruitmentAction.getActions(set.getInt(1), conn))).as("application/json");
				}
				return Results.forbidden("Invalid nation - must be founder or delegate [" + nation + "] [" + set.getString(2) + " | " + set.getString(3) + "]");
			}
			return Results.forbidden("Invalid nation - must be founder or delegate [unknown region]");

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
		try {
			conn = getConnection();
			PreparedStatement select = conn.prepareStatement("SELECT id, delegate, founder FROM assembly.region WHERE name = ?");
			select.setString(1, Utils.sanitizeName(region));
			ResultSet set = select.executeQuery();
			if (set.next()) {
				if (nation.equals(set.getString(2)) || nation.equals(set.getString(3))) {
					PreparedStatement recruitment = conn.prepareStatement("SELECT (SELECT count(*) FROM assembly.recruitment_success WHERE recruiting_region = ? AND tgid = ? AND recruiting_region = nation_region) AS success, (SELECT count(*) FROM assembly.recruitment_success WHERE recruiting_region = ? AND tgid = ?) AS total");
					recruitment.setInt(1, set.getInt(1));
					recruitment.setString(2, tgid);
					recruitment.setInt(3, set.getInt(1));
					recruitment.setString(4, tgid);
					ResultSet data = recruitment.executeQuery();
					data.next();
					return Results.ok("{\"tgid\": \"" + tgid + "\", \"sent_telegrams\":" + data.getInt(2) + ", \"successful_telegrams\": " + data.getInt(1) + "}").as("application/json");
				}
				return Results.forbidden("Invalid nation - must be founder or delegate [" + nation + "] [" + set.getString(2) + " | " + set.getString(3) + "]");
			}
			return Results.forbidden("Invalid nation - must be founder or delegate [unknown region]");

		} finally {
			DbUtils.closeQuietly(conn);
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
			PreparedStatement select = conn.prepareStatement("SELECT id, delegate, founder FROM assembly.region WHERE name = ?");
			select.setString(1, Utils.sanitizeName(region));
			ResultSet set = select.executeQuery();
			if (set.next()) {
				if (nation.equals(set.getString(2)) || nation.equals(set.getString(3))) {
					final String id = Utils.getPostValue(request(), "id");
					final String clientKey = Utils.getPostValue(request(), "clientKey");
					final String tgid = Utils.getPostValue(request(), "tgid");
					final String secretKey = Utils.getPostValue(request(), "secretKey");
					final boolean avoidFull = "true".equalsIgnoreCase(Utils.getPostValue(request(), "avoidFull"));
					final boolean randomize = "true".equalsIgnoreCase(Utils.getPostValue(request(), "randomize"));
					final boolean feedersOnly = "true".equalsIgnoreCase(Utils.getPostValue(request(), "feedersOnly"));
					final String filterRegex = Utils.getPostValue(request(), "filterRegex");
					if (id == null) {
						Integer percent = Integer.parseInt(Utils.getPostValue(request(), "percent"));
						final RecruitmentType type = RecruitmentType.getById(Integer.parseInt(Utils.getPostValue(request(), "type")));

						int totalPercent = percent;
						List<RecruitmentAction> actions = RecruitmentAction.getActions(getDatabase().getRegionIdCache().get(region), conn);
						for (RecruitmentAction action : actions) {
							totalPercent += action.percent;
						}
						if (totalPercent > 100) {
							for (RecruitmentAction action : actions) {
								action.percent = (int)((((float)(action.percent)) / totalPercent) * action.percent);
								action.update(conn);
							}
							percent = (int)((((float)(percent)) / totalPercent) * 100);
						}
						PreparedStatement insert = conn.prepareStatement("INSERT INTO assembly.recruitment (region, client_key, tgid, secret_key, percent, type, feeders_only, filter_regex, avoid_full, randomize) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
						insert.setInt(1, getDatabase().getRegionIdCache().get(region));
						insert.setString(2, clientKey.trim());
						insert.setString(3, tgid.trim());
						insert.setString(4, secretKey.trim());
						insert.setInt(5, percent);
						insert.setInt(6, type.getId());
						insert.setByte(7, (byte)(feedersOnly ? 1 : 0));
						insert.setString(8, filterRegex.trim());
						insert.setByte(9, (byte)(avoidFull ? 1 : 0));
						insert.setByte(10, (byte)(randomize ? 1 : 0));
						insert.executeUpdate();
					} else if (cancel != null) {
						PreparedStatement delete = conn.prepareStatement("DELETE FROM assembly.recruitment WHERE id = ?");
						delete.setInt(1, Integer.parseInt(id));
						delete.executeUpdate();
					} else {
						final Integer percent = Integer.parseInt(Utils.getPostValue(request(), "percent"));
						final RecruitmentType type = RecruitmentType.getById(Integer.parseInt(Utils.getPostValue(request(), "type")));

						List<RecruitmentAction> actions = RecruitmentAction.getActions(getDatabase().getRegionIdCache().get(region), conn);
						for (RecruitmentAction action : actions) {
							if (id.equals(String.valueOf(action.id))) {
								action.clientKey = clientKey;
								action.tgid = tgid;
								action.secretKey = secretKey;
								action.percent = percent;
								action.type = type;
								action.feedersOnly = feedersOnly;
								action.filterRegex = filterRegex;
								action.avoidFull = avoidFull;
								action.randomize = randomize;
								action.error = 0;
								action.update(conn);
								break;
							}
						}
					}
					return Results.ok();
				}
			}
			return Results.forbidden("Invalid nation - must be founder or delegate");
		} finally {
			DbUtils.closeQuietly(conn);
		}
	}
}
