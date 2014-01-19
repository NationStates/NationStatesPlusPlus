package com.afforess.assembly.model;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import org.apache.commons.dbutils.DbUtils;
import com.fasterxml.jackson.annotation.JsonProperty;

public class RecruitmentAction {
	@JsonProperty
	public int id;
	@JsonProperty
	public int region;
	@JsonProperty
	public String clientKey;
	@JsonProperty
	public String tgid;
	@JsonProperty
	public String secretKey;
	@JsonProperty
	public int percent;
	@JsonProperty
	public RecruitmentType type;
	@JsonProperty
	public long lastAction;
	@JsonProperty
	public boolean feedersOnly;
	@JsonProperty
	public String filterRegex;
	@JsonProperty
	public int error;
	@JsonProperty
	public String errorMessage;
	@JsonProperty
	public boolean randomize;

	public RecruitmentAction() {
		this.id = -1;
	}

	public RecruitmentAction(int id, int region, String clientKey, String tgid, String secretKey, int percent, RecruitmentType type, long lastAction, boolean feedersOnly, String filterRegex, int error, boolean randomize) {
		this.id = id;
		this.region = region;
		this.clientKey = clientKey;
		this.tgid = tgid;
		this.secretKey = secretKey;
		this.percent = percent;
		this.type = type;
		this.lastAction = lastAction;
		this.feedersOnly = feedersOnly;
		this.filterRegex = filterRegex;
		this.error = error;
		this.randomize = randomize;
		this.errorMessage = RecruitmentResult.getById(error).getErrorMessage();
	}

	public void update(Connection conn) throws SQLException {
		PreparedStatement update = null;
		try {
			update = conn.prepareStatement("UPDATE assembly.recruitment SET region = ?, client_key = ?, tgid = ?, secret_key = ?, percent = ?, type = ?, last_action = ?, feeders_only = ?, filter_regex = ?, error = ?, randomize = ? WHERE id = ?");
			update.setInt(1, region);
			update.setString(2, clientKey);
			update.setString(3, tgid);
			update.setString(4, secretKey);
			update.setInt(5, percent);
			update.setInt(6, type.getId());
			update.setLong(7, lastAction);
			update.setByte(8, (byte)(feedersOnly ? 1 : 0));
			update.setString(9, filterRegex);
			update.setInt(10, error);
			update.setByte(11, (byte)(randomize ? 1 : 0));
			update.setInt(12, id);
			update.executeUpdate();
		} finally {
			DbUtils.closeQuietly(update);
		}
	}

	public static List<RecruitmentAction> getAllActions(Connection conn) throws SQLException {
		List<RecruitmentAction> actions = new ArrayList<RecruitmentAction>();
		PreparedStatement select = conn.prepareStatement("SELECT id, region, client_key, tgid, secret_key, percent, type, last_action, feeders_only, filter_regex, error, randomize FROM assembly.recruitment ORDER BY RAND()");
		ResultSet result = select.executeQuery();
		while(result.next()) {
			actions.add(new RecruitmentAction(result.getInt(1), result.getInt(2), result.getString(3), result.getString(4), result.getString(5), result.getInt(6), RecruitmentType.getById(result.getInt(7)), result.getLong(8), result.getByte(9) == 1, result.getString(10), result.getInt(11), result.getByte(12) == 1));
		}
		DbUtils.closeQuietly(result);
		DbUtils.closeQuietly(select);
		return actions;
	}

	public static List<RecruitmentAction> getActions(int region, Connection conn) throws SQLException {
		List<RecruitmentAction> actions = new ArrayList<RecruitmentAction>();
		PreparedStatement select = conn.prepareStatement("SELECT id, region, client_key, tgid, secret_key, percent, type, last_action, feeders_only, filter_regex, error, randomize FROM assembly.recruitment WHERE region = ?");
		select.setInt(1, region);
		ResultSet result = select.executeQuery();
		while(result.next()) {
			actions.add(new RecruitmentAction(result.getInt(1), result.getInt(2), result.getString(3), result.getString(4), result.getString(5), result.getInt(6), RecruitmentType.getById(result.getInt(7)), result.getLong(8), result.getByte(9) == 1, result.getString(10), result.getInt(11), result.getByte(12) == 1));
		}
		DbUtils.closeQuietly(result);
		DbUtils.closeQuietly(select);
		return actions;
	}
}
