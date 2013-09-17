package controllers;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;

import org.apache.commons.dbutils.DbUtils;
import org.apache.commons.lang.WordUtils;
import org.codehaus.jackson.annotate.JsonProperty;
import org.joda.time.DateTime;

import com.afforess.assembly.util.NationCache;
import com.afforess.assembly.util.RegionCache;
import com.afforess.assembly.util.Utils;
import com.mchange.v2.c3p0.ComboPooledDataSource;

import play.Logger;
import play.mvc.*;
import play.libs.Json;

public class Application extends DatabaseController {
	private static final String[] CENSUS_NAMES = {null,
			null,
			null,
			"population",
			"wealth gaps",
			"unexpected death rate",
			"compassion",
			"eco-friendliness",
			"social conservatism",
			"nudity",
			"automobile manufacturing",
			"cheese exports",
			"basket weaving",
			"informtion technology",
			"pizza delivery",
			"trout fishing",
			"arms manufacturing",
			"agriculture",
			"beverage sales",
			"timber woodchipping",
			"mining",
			"insurance",
			"furniture restoration",
			"retail",
			"book publishing",
			"gambling",
			"manufacturing",
			"government size",
			"welfare",
			"public healthcare",
			"law enforcement",
			"business subsidization",
			"religiousness",
			"income equality",
			"niceness",
			"rudeness",
			"intelligence",
			"stupidity",
			"political apathy",
			"health",
			"happiness",
			"weather",
			"safety from crime",
			"safety",
			"lifespan",
			"ideological radicality",
			"defense forces",
			"pacifism",
			"most pro-market",
			"taxation",
			"freedom from taxation",
			"corruption",
			"freedom from corruption",
			"authoritarianism",
			"youth rebelliousness",
			"culture",
			"employment",
			"public transport",
			"tourism",
			"weaponization",
			"recreational drug use",
			"obesity",
			"godlessness",
			"environmental beauty",
			"toxicity",
			"influence",
			"world assembly endorsements",
			"averageness",
			"human development index"};

	static {
		for (int i = 0; i < CENSUS_NAMES.length; i++) {
			CENSUS_NAMES[i] = WordUtils.capitalizeFully(CENSUS_NAMES[i]);
		}
	}

	public Application(ComboPooledDataSource pool, NationCache cache, RegionCache regionCache) {
		super(pool, cache, regionCache);
	}

	public Result sendFlagUpdate() {
		response().setHeader("Access-Control-Allow-Origin", "*");
		response().setHeader("Access-Control-Allow-Methods", "POST, GET, HEAD");
		response().setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		return Results.status(BAD_REQUEST);
	}

	public Result flag(String nation) throws SQLException {
		Map<String, String> json = new HashMap<String, String>(2);
		Connection conn = getConnection();
		String flag;;
		try {
			flag = Utils.getNationFlag(nation, getCache(), conn);
			if (flag != null) {
				json.put(nation, flag);
			} else {
				flag = "";
			}
		} finally {
			DbUtils.closeQuietly(conn);
		}

		Result result = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(flag.hashCode()));
		if (result != null) {
			return result;
		}
		return ok(Json.toJson(json)).as("application/json");
	}

	public Result regionFlag(String regions) throws SQLException {
		String eTag = request().getHeader("If-None-Match");
		String[] regionNames = regions.split(",");
		Map<String, String> json = new HashMap<String, String>(regionNames.length);
		for (String region : regionNames) {
			json.put(region, getRegionCache().getRegionFlag(region));
		}
		final String calculatedEtag = String.valueOf(json.hashCode());
		if (calculatedEtag.equals(eTag)) {
			Logger.info("Returning flag " + request().method() + " request from " + request().remoteAddress() + " [" + request().uri() + "] 304 NOT MODIFIED.");
			return Results.status(304);
		}
		response().setHeader("Access-Control-Allow-Origin", "*");
		response().setHeader("Access-Control-Allow-Methods", "POST, GET, HEAD");
		response().setHeader("Access-Control-Max-Age", "3600");
		response().setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		response().setHeader("Cache-Control", "public, max-age=3600");
		response().setHeader("Expires", new DateTime().plusHours(1).toString(Utils.HTTP_DATE_TIME));
		response().setHeader("Last-Modified", new DateTime().plusHours(-1).toString(Utils.HTTP_DATE_TIME));
		response().setHeader("Vary", "Accept-Encoding");
		response().setHeader("ETag", calculatedEtag);
		Logger.info("Returning flag " + request().method() + " request from " + request().remoteAddress() + " [" + request().uri() + "] 200 OK.");
		return ok(Json.toJson(json)).as("application/json");
	}

	public Result getWAMembers() throws SQLException {
		long time = System.nanoTime();
		Map<String, Map<String, Object>> json = new HashMap<String, Map<String, Object>>();
		Connection conn = getConnection();
		try {
			PreparedStatement statement = conn.prepareStatement("SELECT name, endorsements, influence, influence_desc from assembly.nation WHERE wa_member = 1 AND region = 'Capitalist Paradise'");
			ResultSet result = statement.executeQuery();
			while(result.next()) {
				String nation = WordUtils.capitalizeFully(result.getString(1).replaceAll("_", " "));
				HashMap<String, Object> values = new HashMap<String, Object>();
				values.put("endorsements", result.getInt(2));
				values.put("influence", result.getInt(3));
				values.put("influence_desc", result.getString(4));
				json.put(nation, values);
			}
			Logger.info("Query time for all wa members: " + (System.nanoTime() - time) / 1E6D + " ms");
		} finally {
			DbUtils.closeQuietly(conn);
		}

		Result result = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(json.hashCode()));
		if (result != null) {
			return result;
		}
		return ok(Json.toJson(json)).as("application/json");
	}

	public Result getEndorsements(final String nationName) throws SQLException {
		long time = System.nanoTime();
		Map<String, Object> json = new HashMap<String, Object>();
		if (nationName != null && nationName.length() > 0) {
			Connection conn = getConnection();
			try {
				String nation = nationName.toLowerCase().replaceAll(" ", "_");
				int id = getCache().getNationId(nation);
				if (id > -1 && getCache().isWAMember(id)) {
					//Get list of nations of have endorsed us
					PreparedStatement statement = conn.prepareStatement("SELECT endorser from assembly.endorsements WHERE endorsed = ?");
					statement.setInt(1, id);
					ResultSet result = statement.executeQuery();
					HashSet<String> endorsements = new HashSet<String>();
					ArrayList<String[]> endorsementData = new ArrayList<String[]>();
					while(result.next()) {
						int nationId = result.getInt(1);
						endorsements.add(getCache().getNationName(nationId));
						endorsementData.add(new String[] {getCache().getNationName(nationId), getCache().getNationFlag(nationId)});
					}
					Collections.sort(endorsementData, new NationComparator());
					json.put("endorsements", endorsementData.toArray(new String[0][0]));
					result.close();
					statement.close();
					
					//Get list of nations we are endorsing
					statement = conn.prepareStatement("SELECT endorsed from assembly.endorsements WHERE endorser = ?");
					statement.setInt(1, id);
					result = statement.executeQuery();
					HashSet<String> endorsed = new HashSet<String>();
					ArrayList<String[]> endorsedData = new ArrayList<String[]>();
					while(result.next()) {
						int nationId = result.getInt(1);
						endorsed.add(getCache().getNationName(nationId));
						endorsedData.add(new String[] {getCache().getNationName(nationId), getCache().getNationFlag(nationId)});
					}
					Collections.sort(endorsedData, new NationComparator());
					json.put("endorsed", endorsedData.toArray(new String[0][0]));
					
					//Calculate who is not endorsing us back
					HashSet<String> notEndorsing = (new HashSet<String>(endorsements));
					notEndorsing.removeAll(endorsed);
					ArrayList<String[]> notEndorsingData = new ArrayList<String[]>();
					for (String name : notEndorsing) {
						notEndorsingData.add(new String[] {name, getCache().getNationFlag(getCache().getNationId(name))});
					}
					Collections.sort(notEndorsingData, new NationComparator());
					json.put("not_endorsing_back", notEndorsingData.toArray(new String[0][0]));
					
					//Calculate who we are not endorsing us back
					HashSet<String> notEndorsed = (new HashSet<String>(endorsed));
					notEndorsed.removeAll(endorsements);
					ArrayList<String[]> notEndorsedData = new ArrayList<String[]>();
					for (String name : notEndorsed) {
						notEndorsedData.add(new String[] {name, getCache().getNationFlag(getCache().getNationId(name))});
					}
					Collections.sort(notEndorsedData, new NationComparator());
					json.put("not_endorsing", notEndorsedData.toArray(new String[0][0]));
					
					statement = conn.prepareStatement("SELECT name, flag from assembly.nation WHERE alive = 1 AND wa_member = 1 AND region = 'Capitalist Paradise'");
					result = statement.executeQuery();
					ArrayList<String[]> haventEndorsed = new ArrayList<String[]>();
					while(result.next()) {
						String name = result.getString(1);
						String flag = result.getString(2);
						if (!endorsed.contains(name) && !name.equals(nation)) {
							haventEndorsed.add(new String[] {name, flag});
						}
					}
					Collections.sort(haventEndorsed, new NationComparator());
					json.put("havent_endorsed", haventEndorsed.toArray(new String[0][0]));
				} else {
					json.put(nationName, "not_wa_member");
				}
			} finally {
				DbUtils.closeQuietly(conn);
			}
			Logger.info("Query time for all endorsements [" + nationName + "]: " + (System.nanoTime() - time) / 1E6D + " ms");
		}
		Result result = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(json.hashCode()));
		if (result != null) {
			return result;
		}
		return ok(Json.toJson(json)).as("application/json");
	}

	private static class NationComparator implements Comparator<String[]> {
		@Override
		public int compare(String[] o1, String[] o2) {
			return o1[0].compareTo(o2[0]);
		}
	}

	public Result getNationHistory(final String nation) throws SQLException {
		long time = System.nanoTime();
		Map<String, Object> json = new HashMap<String, Object>();

		int nationId = getCache().getNationId(nation);
		if (nationId > -1) {
			Connection conn = getConnection();
			try {
				PreparedStatement select = conn.prepareStatement("SELECT * FROM assembly.nation_history WHERE nation_id = ? AND timestamp >= ?");
				select.setInt(1, nationId);
				select.setLong(2, (System.currentTimeMillis() / 1000L) - (30L * 24L * 60L * 60L));
				ResultSet history = select.executeQuery();
				ResultSetMetaData metadata = history.getMetaData();
				boolean first = true;
				
				ArrayList<HistoryColumn> columns = new ArrayList<HistoryColumn>();
				columns.add(new HistoryColumn("Date", "date"));
				
				ArrayList<ArrayList<HistoryRowElement>> rows = new ArrayList<ArrayList<HistoryRowElement>>();
				
				while(history.next()) {
					long timestamp = history.getLong(2) * 1000;
					ArrayList<HistoryRowElement> row = new ArrayList<HistoryRowElement>();
					row.add(new TimestampHistoryRowElement(timestamp));
					for (int i = 3; i <= metadata.getColumnCount(); i++) {
						String columnName = metadata.getColumnName(i);
						if (columnName.startsWith("CENSUS_")) {
							columnName = CENSUS_NAMES[Integer.parseInt(columnName.substring(7))];
						} else {
							columnName = WordUtils.capitalizeFully(columnName.replaceAll("_", " ").toLowerCase());
						}
						if (columnName == null) {
							continue;
						}
						if (first) {
							columns.add(new HistoryColumn(columnName, "number"));
						}
						int type = metadata.getColumnType(i);
						if (type == Types.INTEGER) {
							row.add(new HistoryRowElement(history.getInt(i)));
						} else if (type == Types.FLOAT || type == Types.REAL) {
							row.add(new HistoryRowElement(history.getFloat(i)));
						}
					}
					rows.add(row);
					first = false;
				}
				history.close();
				select.close();
				
				Collections.sort(rows, new NationHistoryComparator());
				
				json.put("cols", columns.toArray(new HistoryColumn[0]));
				HistoryRow[] jRows = new HistoryRow[rows.size()];
				for (int i = 0; i < rows.size(); i++) {
					jRows[i] = new HistoryRow(rows.get(i).toArray(new HistoryRowElement[0]));
				}
				json.put("rows", jRows);
				
			} finally {
				DbUtils.closeQuietly(conn);
			}
			Logger.info("Query time for national history [" + nation + "]: " + (System.nanoTime() - time) / 1E6D + " ms");
		} else {
			json.put(nation, "unknown_nation");
		}
		Result result = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(json.hashCode()));
		if (result != null) {
			return result;
		}
		return ok(Json.toJson(json)).as("application/json");
	}

	private static class HistoryRow {
		HistoryRow(HistoryRowElement[] row) {
			this.row = row;
		}
		@JsonProperty("c")
		private HistoryRowElement[] row;
	}

	private static class HistoryRowElement {
		private Object value;
		HistoryRowElement(Object value) {
			this.value = value;
		}

		@JsonProperty("v")
		public Object getValue() {
			return value;
		}
	}

	private static class TimestampHistoryRowElement extends HistoryRowElement {
		TimestampHistoryRowElement(long value) {
			super(value);
		}

		@Override
		@JsonProperty("v")
		public Object getValue() {
			return "Date(" + super.getValue() + ")";
		}
	}

	private static class HistoryColumn {
		HistoryColumn(String label, String type) {
			this.label = label;
			this.type = type;
		}
		@JsonProperty
		private String label;
		@JsonProperty
		private String type;
	}

	private static class NationHistoryComparator implements Comparator<ArrayList<HistoryRowElement>>{
		@Override
		public int compare(ArrayList<HistoryRowElement> o1, ArrayList<HistoryRowElement> o2) {
			return Long.compare((Long)o1.get(0).value, (Long)o2.get(0).value);
		}
	}
}
