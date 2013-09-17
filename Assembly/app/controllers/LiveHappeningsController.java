package controllers;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import org.apache.commons.dbutils.DbUtils;
import org.codehaus.jackson.JsonNode;
import org.codehaus.jackson.annotate.JsonProperty;
import org.joda.time.Duration;

import play.Logger;
import play.libs.Json;
import play.mvc.Result;
import play.mvc.Results;

import com.afforess.assembly.util.NationCache;
import com.afforess.assembly.util.RegionCache;
import com.afforess.assembly.util.Utils;
import com.mchange.v2.c3p0.ComboPooledDataSource;

public class LiveHappeningsController extends DatabaseController implements Runnable{
	private final AtomicReference<JsonNode> happenings = new AtomicReference<JsonNode>();
	private final AtomicReference<JsonNode> updateStatus = new AtomicReference<JsonNode>();
	public LiveHappeningsController(ComboPooledDataSource pool, NationCache cache, RegionCache regionCache) {
		super(pool, cache, regionCache);
		happenings.set(Json.toJson(new ArrayList<NationHappening>(1)));
	}

	public Result getLiveFeed() {
		return processJsonNode(happenings.get());
	}

	public Result getUpdateStatus() {
		return processJsonNode(updateStatus.get());
	}

	private Result processJsonNode(JsonNode node) {
		Result result = Utils.handleDefaultGetHeaders(request(), response(), node != null ? String.valueOf(node.hashCode()) : null, "6");
		if (result != null) {
			return result;
		}
		if (node == null) {
			return  Results.internalServerError();
		}
		return ok(Json.toJson(node)).as("application/json");
	}

	private static class NationHappening {
		NationHappening(int id, String nation, String happening, long timestamp) {
			this.id = id;
			this.nation = nation;
			this.text = happening;
			this.timestamp = timestamp;
		}
		@JsonProperty
		private String text;
		@JsonProperty
		private String nation;
		@JsonProperty
		private long timestamp;
		@JsonProperty
		private int id;
	}

	@Override
	public void run() {
		Connection conn = null;
		List<NationHappening> happeningList = new ArrayList<NationHappening>(1000);
		try {
			conn = this.getConnection();
			PreparedStatement select = conn.prepareStatement("SELECT id, nation, happening, timestamp FROM assembly.global_happenings WHERE timestamp > ? ORDER BY timestamp DESC");
			select.setLong(1, System.currentTimeMillis() - Duration.standardMinutes(9).getMillis());
			ResultSet result = select.executeQuery();
			while(result.next()) {
				happeningList.add(new NationHappening(result.getInt(1), result.getString(2), result.getString(3), result.getLong(4)));
			}
			for (NationHappening happening : happeningList) {
				happening.text = Utils.formatHappeningText(happening.text, getCache(), conn, true, happening.nation);
			}
		} catch (SQLException e) {
			Logger.error("Unable to update live happenings", e);
		} finally {
			DbUtils.closeQuietly(conn);
		}
		happenings.set(Json.toJson(happeningList));
		Map<String, Boolean> status = new HashMap<String, Boolean>();
		status.put("update", happeningList.size() > 750);
		updateStatus.set(Json.toJson(status));
	}
}
