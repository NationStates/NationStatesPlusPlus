package controllers;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Savepoint;
import java.sql.Statement;
import java.sql.Types;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.ExecutionException;

import org.apache.commons.dbutils.DbUtils;
import org.joda.time.Duration;
import org.spout.cereal.config.yaml.YamlConfiguration;

import play.Logger;
import play.libs.Json;
import play.mvc.Result;
import play.mvc.Results;

import com.afforess.assembly.HappeningsTask;
import com.afforess.assembly.model.HappeningType;
import com.afforess.assembly.model.RecruitmentType;
import com.afforess.assembly.util.DatabaseAccess;
import com.afforess.assembly.util.Utils;
import com.fasterxml.jackson.databind.JsonNode;
import com.limewoodMedia.nsapi.NationStates;
import com.mysql.jdbc.exceptions.jdbc4.MySQLTransactionRollbackException;

public class RecruitmentController extends NationStatesController {
	public RecruitmentController(DatabaseAccess access, YamlConfiguration config, NationStates api) {
		super(access, config, api);
	}

	private boolean isValidAccessKey(String region, String key) throws SQLException {
		if (key == null || region == null || key.isEmpty() || region.isEmpty()) return false;
		Connection conn = null;
		PreparedStatement accessKey = null;
		ResultSet set = null;
		try {
			conn = getConnection();
			accessKey = conn.prepareStatement("SELECT access_key FROM assembly.recruitment_scripts WHERE region = ?");
			accessKey.setString(1, Utils.sanitizeName(region));
			set = accessKey.executeQuery();
			if (set.next()) {
				if (set.getString(1).equals(key)) {
					return true;
				}
			}
		} finally {
			DbUtils.closeQuietly(set);
			DbUtils.closeQuietly(accessKey);
			DbUtils.closeQuietly(conn);
		}
		return false;
	}

	public Result getRecruitmentCampaigns(String region, boolean includeStats) throws SQLException {
		Result ret = Utils.validateRequest(request(), response(), getAPI(), getDatabase());
		if (ret != null) {
			return ret;
		}
		String nation = Utils.sanitizeName(Utils.getPostValue(request(), "nation"));
		List<Map<String, Object>> campaigns = new ArrayList<Map<String, Object>>();
		Connection conn = null;
		try {
			conn = getConnection();
			final int regionId = getRecruitmentAdministrator(conn, nation, region);
			if (regionId == -1) {
				Utils.handleDefaultPostHeaders(request(), response());
				return Results.unauthorized();
			}
			PreparedStatement select = conn.prepareStatement("SELECT id, created, retired, type, client_key, tgid, secret_key, allocation, gcrs_only FROM assembly.recruit_campaign WHERE region = ? AND visible = 1 ORDER BY created DESC");
			select.setInt(1, regionId);
			ResultSet set = select.executeQuery();
			while(set.next()) {
				Map<String, Object> campaign = new HashMap<String, Object>();
				campaign.put("id", set.getInt("id"));
				campaign.put("created", set.getLong("created"));
				campaign.put("retired", set.getLong("retired"));
				campaign.put("type", set.getInt("type"));
				campaign.put("client_key", set.getString("client_key"));
				campaign.put("tgid", set.getInt("tgid"));
				campaign.put("secret_key", set.getString("secret_key"));
				campaign.put("allocation", set.getInt("allocation"));
				campaign.put("gcrs_only", set.getInt("gcrs_only"));
				campaigns.add(campaign);
				
				if (includeStats) {
					PreparedStatement totalSent = conn.prepareStatement("SELECT count(id) FROM assembly.recruitment_results WHERE campaign = ?");
					totalSent.setInt(1, set.getInt("id"));
					ResultSet total = totalSent.executeQuery();
					total.next();
					campaign.put("total_sent", total.getInt(1));
					DbUtils.closeQuietly(total);
					DbUtils.closeQuietly(totalSent);
					
					PreparedStatement pendingRecruits = conn.prepareStatement("SELECT count(r.id) FROM assembly.recruitment_results AS r LEFT JOIN assembly.nation AS n ON n.id = r.nation WHERE r.timestamp > ? AND r.campaign = ? AND n.alive = 1 AND n.region = r.region");
					pendingRecruits.setLong(1, System.currentTimeMillis() - Duration.standardDays(14).getMillis());
					pendingRecruits.setInt(2, set.getInt("id"));
					total = pendingRecruits.executeQuery();
					total.next();
					campaign.put("pending_recruits", total.getInt(1));
					DbUtils.closeQuietly(total);
					DbUtils.closeQuietly(pendingRecruits);
					
					PreparedStatement recruits = conn.prepareStatement("SELECT count(r.id) FROM assembly.recruitment_results AS r LEFT JOIN assembly.nation AS n ON n.id = r.nation WHERE r.timestamp < ? AND r.campaign = ? AND n.alive = 1 AND n.region = r.region");
					recruits.setLong(1, System.currentTimeMillis() - Duration.standardDays(14).getMillis());
					recruits.setInt(2, set.getInt("id"));
					total = recruits.executeQuery();
					total.next();
					campaign.put("recruits", total.getInt(1));
					DbUtils.closeQuietly(total);
					DbUtils.closeQuietly(recruits);
					
					PreparedStatement deadRecruits = conn.prepareStatement("SELECT count(r.id) FROM assembly.recruitment_results AS r LEFT JOIN assembly.nation AS n ON n.id = r.nation WHERE r.campaign = ? AND n.alive = 0 AND n.region = r.region");
					deadRecruits.setInt(1, set.getInt("id"));
					total = deadRecruits.executeQuery();
					total.next();
					campaign.put("dead_recruits", total.getInt(1));
					DbUtils.closeQuietly(total);
					DbUtils.closeQuietly(recruits);
				}
			}
			DbUtils.closeQuietly(set);
			DbUtils.closeQuietly(select);
		} finally {
			DbUtils.closeQuietly(conn);
		}
		Utils.handleDefaultPostHeaders(request(), response());
		return ok(Json.toJson(campaigns)).as("application/json");
	}

	public Result hideRecruitmentCampaign(String region, int id) throws SQLException {
		Result ret = Utils.validateRequest(request(), response(), getAPI(), getDatabase());
		if (ret != null) {
			return ret;
		}
		String nation = Utils.sanitizeName(Utils.getPostValue(request(), "nation"));
		Connection conn = null;
		try {
			conn = getConnection();
			final int regionId = getRecruitmentAdministrator(conn, nation, region);
			if (regionId == -1) {
				Utils.handleDefaultPostHeaders(request(), response());
				return Results.unauthorized();
			}
			
			PreparedStatement update = conn.prepareStatement("UPDATE assembly.recruit_campaign SET visible = 0 WHERE visible = 1 AND region = ? AND id = ? AND retired IS NOT NULL");
			update.setInt(1, regionId);
			update.setInt(2, id);
			update.executeUpdate();
			DbUtils.closeQuietly(update);
		} finally {
			DbUtils.closeQuietly(conn);
		}
		Utils.handleDefaultPostHeaders(request(), response());
		return Results.ok();
	}

	public Result retireRecruitmentCampaign(String region, int id) throws SQLException {
		Result ret = Utils.validateRequest(request(), response(), getAPI(), getDatabase());
		if (ret != null) {
			return ret;
		}
		String nation = Utils.sanitizeName(Utils.getPostValue(request(), "nation"));
		Connection conn = null;
		try {
			conn = getConnection();
			final int regionId = getRecruitmentAdministrator(conn, nation, region);
			if (regionId == -1) {
				Utils.handleDefaultPostHeaders(request(), response());
				return Results.unauthorized();
			}
			
			PreparedStatement update = conn.prepareStatement("UPDATE assembly.recruit_campaign SET retired = ? WHERE region = ? AND id = ? AND retired IS NULL");
			update.setLong(1, System.currentTimeMillis());
			update.setInt(2, regionId);
			update.setInt(3, id);
			update.executeUpdate();
			DbUtils.closeQuietly(update);
		} finally {
			DbUtils.closeQuietly(conn);
		}
		Utils.handleDefaultPostHeaders(request(), response());
		return Results.ok();
	}

	public Result createRecruitmentCampaign(String region) throws SQLException {
		Result ret = Utils.validateRequest(request(), response(), getAPI(), getDatabase());
		if (ret != null) {
			return ret;
		}
		Utils.handleDefaultPostHeaders(request(), response());
		
		//Validation
		final int type;
		try {
			type = Integer.parseInt(Utils.getPostValue(request(), "type"));
		} catch (NumberFormatException e) {
			return Results.badRequest("Invalid recruitment type");
		}
		if (RecruitmentType.getById(type) == null) {
			return Results.badRequest("Unknown recruitment type");
		}

		final String clientKey = Utils.getPostValue(request(), "clientKey");
		if (clientKey == null) return Results.badRequest("Invalid client key");
		
		final int tgid;
		try {
			tgid = Integer.parseInt(Utils.getPostValue(request(), "tgid"));
		} catch (NumberFormatException e) {
			return Results.badRequest("Invalid telegram id");
		}
		
		final String secretKey = Utils.getPostValue(request(), "secretKey");
		if (secretKey == null) return Results.badRequest("Invalid secret key");
		
		final int allocation;
		try {
			allocation = Integer.parseInt(Utils.getPostValue(request(), "allocation"));
		} catch (NumberFormatException e) {
			return Results.badRequest("Invalid percent allocated amount");
		}
		
		final int gcrsOnly;
		try {
			gcrsOnly = Integer.parseInt(Utils.getPostValue(request(), "gcrsOnly"));
		} catch (NumberFormatException e) {
			return Results.badRequest("Invalid value for GCRS Only.");
		}

		String filters = Utils.getPostValue(request(), "filters");
		if (filters != null) {
			StringBuilder filterText = new StringBuilder("");
			for (String filter : filters.split(",")) {
				if (filterText.length() != 0) filterText.append(", ");
				filterText.append(filter.toLowerCase().trim());
			}
			filters = filterText.toString();
		}

		String nation = Utils.sanitizeName(Utils.getPostValue(request(), "nation"));
		Connection conn = null;
		try {
			conn = getConnection();
			final int regionId = getRecruitmentAdministrator(conn, nation, region);
			if (regionId == -1) {
				Utils.handleDefaultPostHeaders(request(), response());
				return Results.unauthorized();
			}
			
			PreparedStatement update = conn.prepareStatement("INSERT INTO assembly.recruit_campaign (created, type, region, client_key, tgid, secret_key, allocation, gcrs_only, filters) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
			update.setLong(1, System.currentTimeMillis());
			update.setInt(2, type);
			update.setInt(3, regionId);
			update.setString(4, clientKey);
			update.setInt(5, tgid);
			update.setString(6, secretKey);
			update.setInt(7, Math.min(100, Math.max(0, allocation)));
			update.setByte(8, (byte)(gcrsOnly == 0 ? 0 : 1));
			if (filters != null)
				update.setString(9, filters);
			else
				update.setNull(9, Types.LONGVARCHAR);
			update.executeUpdate();
			DbUtils.closeQuietly(update);
		} finally {
			DbUtils.closeQuietly(conn);
		}

		return getRecruitmentCampaigns(region, true);
	}

	public Result getRecruitmentOfficers(String region, boolean includeAdmins) throws SQLException {
		Connection conn = null;
		List<Object> officers = new ArrayList<Object>();
		try {
			conn = getConnection();
			final int regionId = getDatabase().getRegionId(region);
			PreparedStatement select = conn.prepareStatement("SELECT nation.name, nation.full_name FROM assembly.recruitment_officers LEFT JOIN assembly.nation ON nation.id = recruitment_officers.nation WHERE recruitment_officers.region = ?");
			select.setInt(1, regionId);
			ResultSet set = select.executeQuery();
			while(set.next()) {
				Map<String, String> nation = new HashMap<String, String>(2);
				nation.put("name", set.getString(1));
				nation.put("full_name", set.getString(2));
				officers.add(nation);
			}
			DbUtils.closeQuietly(set);
			DbUtils.closeQuietly(select);
			
			if (includeAdmins) {
				select = conn.prepareStatement("SELECT delegate, founder FROM assembly.region WHERE id = ?");
				select.setInt(1, regionId);
				set = select.executeQuery();
				if(set.next()) {
					if (set.getString(1) != "0") {
						Map<String, String> nation = new HashMap<String, String>(2);
						nation.put("name", set.getString(1));
						officers.add(nation);
					}
					
					if (set.getString(2) != "0") {
						Map<String, String> nation = new HashMap<String, String>(2);
						nation.put("name", set.getString(2));
						officers.add(nation);
					}
				}
			}
		} finally {
			DbUtils.closeQuietly(conn);
		}
		Result result = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(officers.hashCode()), "600");
		if (result != null) {
			return result;
		}
		return ok(Json.toJson(officers)).as("application/json");
	}

	public static Set<Integer> getRecruitmentOfficerIds(Connection conn, DatabaseAccess access, int regionId) throws SQLException {
		HashSet<Integer> officers = new HashSet<Integer>();
		PreparedStatement select = conn.prepareStatement("SELECT nation FROM assembly.recruitment_officers WHERE region = ?");
		select.setInt(1, regionId);
		ResultSet set = select.executeQuery();
		while(set.next()) {
			officers.add(set.getInt(1));
		}
		DbUtils.closeQuietly(set);
		DbUtils.closeQuietly(select);
		
		select = conn.prepareStatement("SELECT delegate, founder FROM assembly.region WHERE id = ?");
		select.setInt(1, regionId);
		set = select.executeQuery();
		if(set.next()) {
			if (set.getString(1) != "0") {
				officers.add(access.getNationId(set.getString(1)));
			}
			if (set.getString(2) != "0") {
				officers.add(access.getNationId(set.getString(2)));
			}
		}
		return officers;
	}

	public static boolean doesRegionHaveActiveRecruitmentCampaigns(Connection conn, int regionId) throws SQLException {
		PreparedStatement select = conn.prepareStatement("SELECT count(id) FROM assembly.recruit_campaign WHERE region = ? AND retired IS NULL");
		select.setInt(1, regionId);
		ResultSet result = select.executeQuery();
		if (result.next() && result.getInt(1) > 0) {
			return true;
		}
		return false;
	}

	public Result changeOfficers(String region) throws SQLException {
		Result ret = Utils.validateRequest(request(), response(), getAPI(), getDatabase());
		if (ret != null) {
			return ret;
		}
		Utils.handleDefaultPostHeaders(request(), response());
		
		String add = Utils.getPostValue(request(), "add");
		String remove = Utils.getPostValue(request(), "remove");
		String submitter = Utils.getPostValue(request(), "nation");
		
		Connection conn = null;
		try {
			conn = getConnection();

			final int regionId = getRecruitmentAdministrator(conn, submitter, region);
			if (regionId == -1) {
				Utils.handleDefaultPostHeaders(request(), response());
				return Results.unauthorized();
			}

			Set<Integer> existingOfficers = new HashSet<Integer>();
			PreparedStatement select = conn.prepareStatement("SELECT nation FROM assembly.recruitment_officers WHERE region = ?");
			select.setInt(1, regionId);
			ResultSet set = select.executeQuery();
			while(set.next()) {
				existingOfficers.add(set.getInt(1));
			}
			
			if (existingOfficers.size() >= 5 && add != null) {
				if (remove == null || remove.split(",").length < add.split(",").length) {
					return Results.badRequest("Can not set more than 5 recruitment officers");
				}
			}
			
			DbUtils.closeQuietly(set);
			DbUtils.closeQuietly(select);
			
			Map<String, String> errors = new HashMap<String, String>();
			conn.setAutoCommit(false);
			Savepoint save = conn.setSavepoint(String.valueOf(System.currentTimeMillis()));
			if (add != null) {
				for (String nation : add.split(",")) {
					final String format = Utils.sanitizeName(nation);
					final int nationId = getDatabase().getNationId(format);
					if (nationId > -1) {
						if (!existingOfficers.contains(nationId)) {
							PreparedStatement officers = conn.prepareStatement("INSERT INTO assembly.recruitment_officers (region, nation) VALUES (?, ?)");
							officers.setInt(1, regionId);
							officers.setInt(2, nationId);
							officers.executeUpdate();
							DbUtils.closeQuietly(officers);
						}
					} else {
						errors.put("error", "unknown nation: " + nation);
						conn.rollback(save);
						return Results.ok(Json.toJson(errors)).as("application/json");
					}
				}
			}
			if (remove != null) {
				for (String nation : remove.split(",")) {
					final String format = Utils.sanitizeName(nation);
					final int nationId = getDatabase().getNationId(format);
					if (nationId > -1) {
						if (existingOfficers.contains(nationId)) {
							PreparedStatement officer = conn.prepareStatement("DELETE FROM assembly.recruitment_officers WHERE region = ? AND nation = ?");
							officer.setInt(1, regionId);
							officer.setInt(2, nationId);
							officer.executeUpdate();
							DbUtils.closeQuietly(officer);
						}
					} else {
						errors.put("error", "unknown nation: " + nation);
						conn.rollback(save);
						return Results.ok(Json.toJson(errors)).as("application/json");
					}
				}
			}
			conn.commit();
		} finally {
			if (conn != null) {
				conn.setAutoCommit(true);
			}
			DbUtils.closeQuietly(conn);
		}
		return Results.ok();
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

	private int getRecruitmentAdministrator(Connection conn, String nation, String region) throws SQLException {
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
			officers.setInt(2, getDatabase().getNationId(nation));
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

	public Result findRecruitmentTarget(String region, String accessKey, boolean userAgentFix) throws SQLException, ExecutionException {
		Utils.handleDefaultPostHeaders(request(), response());
		if (!userAgentFix) {
			Map<String, Object> temp = new HashMap<String, Object>();
			temp.put("wait", "30");
			return ok(Json.toJson(temp)).as("application/json");
		}

		final boolean validScriptAccess = isValidAccessKey(region, accessKey);
		//Bypass standard nation authentication if we are a valid script
		if (!validScriptAccess) {
			Result ret = Utils.validateRequest(request(), response(), getAPI(), getDatabase());
			if (ret != null) {
				return ret;
			}
		}
		String nation = Utils.sanitizeName(Utils.getPostValue(request(), "nation"));
		Connection conn = null;
		try {
			conn = getConnection();
			
			final int regionId;
			//Bypass region officer authentication if we are a valid script
			if (!validScriptAccess) {
				regionId = getRecruitmentAdministrator(conn, nation, region);
			} else {
				regionId = getDatabase().getRegionId(region);
			}

			if (regionId == -1) {
				return Results.unauthorized();
			}

			return ok(Json.toJson(calculateRecruitmentTarget(getDatabase(), conn, regionId, nation))).as("application/json");
		} finally {
			DbUtils.closeQuietly(conn);
		}
	}

	public static JsonNode calculateRecruitmentTarget(DatabaseAccess access, Connection conn, int regionId, String nation) throws SQLException, ExecutionException {
		//If another nation is already recruiting right now, abort
		if (canRecruit(conn, regionId)) {
			Map<String, Object> data = getRecruitmentTarget(access, conn, regionId, nation);
			if (data != null) {
				return Json.toJson(data);
			}
		}
		
		Map<String, Object> wait = new HashMap<String, Object>();
		PreparedStatement lastRecruitment = conn.prepareStatement("SELECT nation, timestamp, recruiter FROM assembly.recruitment_results WHERE region = ? ORDER BY timestamp DESC LIMIT 0, 1");
		lastRecruitment.setInt(1, regionId);
		ResultSet set = lastRecruitment.executeQuery();
		long timestamp = System.currentTimeMillis();
		if (set.next()) {
			wait.put("nation", access.getReverseIdCache().get(set.getInt("nation")));
			wait.put("timestamp", set.getLong("timestamp"));
			wait.put("recruiter", access.getReverseIdCache().get(set.getInt("recruiter")));
			timestamp = set.getLong("timestamp");
		}
		DbUtils.closeQuietly(set);
		DbUtils.closeQuietly(lastRecruitment);
		wait.put("wait", Math.max(((Duration.standardMinutes(3).getMillis() + SAFETY_FACTOR + timestamp) - System.currentTimeMillis()) / 1000 + 1, 10));
		return Json.toJson(wait);
	}

	private static final long SAFETY_FACTOR = Duration.standardSeconds(10).getMillis();
	private static boolean canRecruit(Connection conn, int region) throws SQLException {
		PreparedStatement lastRecruitment = null;
		ResultSet recruitment = null;
		try {
			lastRecruitment = conn.prepareStatement("SELECT timestamp, confirmed FROM assembly.recruitment_results WHERE region = ? ORDER BY timestamp DESC LIMIT 0, 1");
			lastRecruitment.setInt(1, region);
			recruitment = lastRecruitment.executeQuery();
			if (recruitment.next()) {
				long timestamp = recruitment.getLong(1);
				int confirmed = recruitment.getInt(2);
				if (confirmed == 1 && timestamp + SAFETY_FACTOR + Duration.standardMinutes(3).getMillis() < System.currentTimeMillis()) {
					return true;
				} else if (confirmed == 0 && timestamp + SAFETY_FACTOR + Duration.standardMinutes(4).getMillis() < System.currentTimeMillis()) {
					return true;
				}
			} else {
				return true;
			}
			return false;
		} finally {
			DbUtils.closeQuietly(lastRecruitment);
			DbUtils.closeQuietly(recruitment);
		}
	}

	private static Map<String, Object> getRecruitmentTarget(DatabaseAccess access, Connection conn, int region, String nation) throws SQLException {
		final Random rand = new Random();
		PreparedStatement select = conn.prepareStatement("SELECT id, type, client_key, tgid, secret_key, allocation, gcrs_only, filters FROM assembly.recruit_campaign WHERE region = ? AND visible = 1 AND retired IS NULL ORDER BY RAND()");
		select.setInt(1, region);
		ResultSet set = select.executeQuery();
		while(set.next()) {
			final int campaign = set.getInt("id");
			RecruitmentType type = RecruitmentType.getById(set.getInt("type"));
			final String clientKey = set.getString("client_key");
			final int tgid = set.getInt("tgid");
			final String secretKey = set.getString("secret_key");
			final int allocation = set.getInt("allocation");
			final boolean gcrsOnly = set.getInt("gcrs_only") == 1;
			if (rand.nextInt(100) < allocation || set.isLast()) {
				final String target = type.findRecruitmentNation(conn, region, gcrsOnly, set.getString("filters"));
				if (target != null) {
					final int nationId = access.getNationId(target);
					if (nationId != -1) {
						PreparedStatement insert = conn.prepareStatement("INSERT INTO assembly.recruitment_results (region, nation, timestamp, campaign, recruiter, confirmed) VALUES (?, ?, ?, ?, ?, ?)", Statement.RETURN_GENERATED_KEYS);
						insert.setInt(1, region);
						insert.setInt(2, nationId);
						insert.setLong(3, System.currentTimeMillis());
						insert.setInt(4, campaign);
						insert.setInt(5, access.getNationId(nation));
						insert.setInt(6, -1);
						insert.executeUpdate();
						ResultSet keys = insert.getGeneratedKeys();
						int insertId = -1;
						keys.next();
						insertId = keys.getInt(1);

						DbUtils.closeQuietly(keys);
						DbUtils.closeQuietly(insert);
						
						//Lame as this seems, MySQL recommends "retrying" in client side applications if a deadlock is thrown
						boolean success = false;
						MySQLTransactionRollbackException deadlock = null;
						for (int tries = 0; tries < 3; tries++) {
							try {
								Map<String, Object> wait = tryUpdateRecruitmentResults(conn, insertId, region, nation);
								if (wait != null) {
									return wait;
								}
								success = true;
								break;
							} catch (MySQLTransactionRollbackException ex) {
								deadlock = ex;
							}
						}
						if (!success) {
							Logger.error("Unable to execute recruitment results confirmation, failed all 3 tries!", deadlock);
							return null;
						}

						Map<String, Object> data = new HashMap<String, Object>();
						data.put("client_key", clientKey);
						data.put("tgid", tgid);
						data.put("secret_key", secretKey);
						data.put("nation", target);
						return data;
					} else {
						Logger.warn("Recruitment Target [" + target + "] has no nation id");;
					}
				}
			}
		}
		DbUtils.closeQuietly(set);
		DbUtils.closeQuietly(select);
		return null;
	}

	private static Map<String, Object> tryUpdateRecruitmentResults(Connection conn, int insertId, int region, String nation) throws SQLException {
		PreparedStatement confirm = conn.prepareStatement("UPDATE assembly.recruitment_results SET confirmed = 0 WHERE id = ? AND (SELECT count FROM assembly.new_recruitments WHERE region = ?) = 1");
		confirm.setInt(1, insertId);
		confirm.setInt(2, region);
		if (confirm.executeUpdate() == 0) {
			PreparedStatement delete = conn.prepareStatement("DELETE FROM assembly.recruitment_results WHERE id = ? OR (confirmed = -1 AND timestamp < ?)");
			delete.setInt(1, insertId);
			delete.setLong(2, System.currentTimeMillis() - Duration.standardMinutes(5).getMillis());
			delete.executeUpdate();
			Logger.info("Prevented double recruitment for region [" + region + "], by [" + nation + "].");
			Map<String, Object> wait = new HashMap<String, Object>();
			wait.put("wait", (Duration.standardMinutes(3).getMillis() + SAFETY_FACTOR) / 1000L);
			return wait;
		}
		return null;
	}

	public Result confirmRecruitmentSent(String region, String target, String accessKey) throws SQLException {
		final boolean validScriptAccess = isValidAccessKey(region, accessKey);
		//Bypass standard nation authentication if we are a valid script
		if (!validScriptAccess) {
			Result ret = Utils.validateRequest(request(), response(), getAPI(), getDatabase());
			if (ret != null) {
				return ret;
			}
		}
		Utils.handleDefaultPostHeaders(request(), response());
		Connection conn = null;
		try {
			conn = getConnection();
			final int regionId;
			//Bypass region officer authentication if we are a valid script
			if (validScriptAccess) {
				regionId = getDatabase().getRegionId(region);
			} else {
				String nation = Utils.sanitizeName(Utils.getPostValue(request(), "nation"));
				regionId = getRecruitmentAdministrator(conn, nation, region);
			}
			if (regionId == -1) {
				Utils.handleDefaultPostHeaders(request(), response());
				return Results.unauthorized();
			}
			confirmRecruitment(getDatabase(), conn, regionId, target);
		} finally {
			DbUtils.closeQuietly(conn);
		}
		return Results.ok();
	}

	public static void confirmRecruitment(DatabaseAccess access, Connection conn, int regionId, String target) throws SQLException {
		PreparedStatement update = conn.prepareStatement("UPDATE assembly.recruitment_results SET confirmed = 1 WHERE region = ? AND nation = ? AND timestamp > ?");
		update.setInt(1, regionId);
		update.setInt(2, access.getNationId(target));
		update.setLong(3, System.currentTimeMillis() - Duration.standardHours(1).getMillis()); //Ensure we are not tampering with ancient results
		update.executeUpdate();
		DbUtils.closeQuietly(update);
	}

	public Result markPuppetNation(String nation) {
		Utils.handleDefaultPostHeaders(request(), response());
		nation = Utils.sanitizeName(nation);
		if (getDatabase().getNationId(nation) == -1) {
			HappeningsTask.markNationAsPuppet(nation);
			return Results.ok();
		}
		return Results.badRequest();
	}
}
