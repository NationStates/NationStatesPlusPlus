package com.afforess.assembly.util;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Savepoint;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.net.ssl.HttpsURLConnection;

import org.apache.commons.dbutils.DbUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.WordUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import org.joda.time.DateTime;
import org.joda.time.format.DateTimeFormatter;
import org.joda.time.format.DateTimeFormatterBuilder;

import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import com.limewoodMedia.nsapi.NationStates;
import com.limewoodMedia.nsapi.enums.WAStatus;
import com.limewoodMedia.nsapi.exceptions.RateLimitReachedException;
import com.limewoodMedia.nsapi.exceptions.UnknownNationException;
import com.limewoodMedia.nsapi.holders.NationData;
import com.limewoodMedia.nsapi.holders.NationData.Shards;

import play.Logger;
import play.mvc.Http.Request;
import play.mvc.Http.Response;
import play.mvc.Http;
import play.mvc.Result;
import play.mvc.Results;

public class Utils {
	public static final Pattern NATION_PATTERN = Pattern.compile("@@[^\\s]*@@");
	public static final Pattern REGION_PATTERN = Pattern.compile("%%[^\\s]*%%");
	public static final Pattern RMB_PATTERN = Pattern.compile("##[^\\s]*##");
	public static final DateTimeFormatter HTTP_DATE_TIME = (new DateTimeFormatterBuilder()).appendDayOfWeekShortText().appendLiteral(", ")
			.appendDayOfMonth(2).appendLiteral(' ')
			.appendMonthOfYearShortText().appendLiteral(' ')
			.appendYear(4,4).appendLiteral(' ')
			.appendHourOfDay(2).appendLiteral(':')
			.appendMinuteOfHour(2).appendLiteral(':')
			.appendSecondOfMinute(2).appendLiteral(" GMT").toFormatter();
	private static final Cache<String, Boolean> recentAuthRequest;
	private static final NationStates authAPI = new NationStates();
	static {
		authAPI.setRateLimit(47);
		authAPI.setUserAgent("NationStates++ Authentication Server");
		authAPI.setRelaxed(true);
		authAPI.setProxyIP("162.243.18.166");
		authAPI.setProxyPort(3128);
		
		recentAuthRequest = CacheBuilder.newBuilder().maximumSize(250).expireAfterWrite(5, TimeUnit.SECONDS).build();
	}

	public static Result handleDefaultGetHeaders(Request request, Response response, String calculatedEtag) {
		return handleDefaultGetHeaders(request, response, calculatedEtag, "60");
	}

	public static Result handleDefaultGetHeaders(Request request, Response response, String calculatedEtag, String seconds) {
		response.setHeader("Access-Control-Allow-Origin", "*");
		response.setHeader("Access-Control-Allow-Methods", "POST, GET, HEAD");
		response.setHeader("Access-Control-Max-Age", seconds);
		response.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		response.setHeader("Cache-Control", "public, max-age=" + seconds);
		response.setHeader("Expires", new DateTime().plusHours(1).plusSeconds(Integer.parseInt(seconds)).toString(Utils.HTTP_DATE_TIME));
		response.setHeader("Last-Modified", new DateTime().plusHours(-1).plusSeconds(-Integer.parseInt(seconds)).toString(Utils.HTTP_DATE_TIME));
		response.setHeader("Vary", "Accept-Encoding");
		if (calculatedEtag != null) {
			response.setHeader("ETag", calculatedEtag);
			String eTag = request.getHeader("If-None-Match");
			if (calculatedEtag != null && calculatedEtag.equals(eTag)) {
				return Results.status(304);
			}
		}
		return null;
	}

	public static void handleDefaultPostHeaders(Request request, Response response) {
		response.setHeader("Access-Control-Allow-Origin", "*");
		response.setHeader("Access-Control-Allow-Methods", "POST, GET, HEAD");
		response.setHeader("Access-Control-Max-Age", "60");
		response.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	}

	public static String formatHappeningText(String text, Connection conn, String owner) throws SQLException {
		text = text.replaceAll("%%capitalist_paradise%rmb%%", "<a href=\"http://www.nationstates.net/region=capitalist_paradise#rmb \">Regional Message Board</a>");
		do {
			Matcher match = NATION_PATTERN.matcher(text);
			if (match.find()) {
				String nation = text.substring(match.start() + 2, match.end() - 2);
				String replacement = formatFullName(nation, conn, !owner.equals(nation));
				text = match.replaceFirst(replacement);
			} else {
				break;
			}
		} while (true);

		do {
			Matcher match = REGION_PATTERN.matcher(text);
			if (match.find()) {
				String region = text.substring(match.start() + 2, match.end() - 2);
				String replacement = "<a href=\"http://www.nationstates.net/region=" + region + "\">" + formatName(region) + "</a>";
				text = match.replaceFirst(replacement);
			} else {
				break;
			}
		} while (true);
		
		do {
			Matcher match = RMB_PATTERN.matcher(text);
			if (match.find()) {
				String region = text.substring(match.start() + 2, match.end() - 2);
				String replacement = "<a href=\"http://www.nationstates.net/region=" + region + "#rmb\">Regional Message Board</a>";
				text = match.replaceFirst(replacement);
			} else {
				break;
			}
		} while (true);
		
		return text;
	}

	public static String formatFullName(String nation, Connection conn, boolean fullName) throws SQLException {
		PreparedStatement statement = null;
		ResultSet result = null;
		try {
			statement = conn.prepareStatement("SELECT full_name, flag, alive, title from assembly.nation WHERE name = ?");
			statement.setString(1, sanitizeName(nation));
			result = statement.executeQuery();
			if (result.next()) {
				//Dead, return just full title
				if (result.getByte(3) != 1) {
					return result.getString(1);
				} else {
					return "<a href=\"http://www.nationstates.net/nation=" + nation + "\"><img src=\"" + result.getString(2) + "\" class=\"miniflag\" alt=\"\" title=\"" + result.getString(1) + "\">" + (fullName ? result.getString(1) : result.getString(4)) + "</a>";
				}
			}
			return formatNationLink(nation);
		} finally {
			DbUtils.closeQuietly(result);
			DbUtils.closeQuietly(statement);
		}
	}

	public static String sanitizeName(String name) {
		return name != null ? name.toLowerCase().replaceAll(" ", "_") : null;
	}

	public static String formatName(String name) {
		return WordUtils.capitalizeFully(name.replaceAll("_", " "));
	}

	public static String formatNationLink(String nation) {
		return "<a href=\"http://www.nationstates.net/nation=" + nation + "\">" + formatName(nation) + "</a>";
	}

	public static String getNationFlag(String nation, Connection conn) throws SQLException {
		return getNationFlag(nation, conn, "http://www.nationstates.net/images/flags/Default.png");
	}

	public static String getNationFlag(String nation, Connection conn, String defaultFlag) throws SQLException {
		PreparedStatement statement = null;
		ResultSet result = null;
		try {
			statement = conn.prepareStatement("SELECT flag, alive from assembly.nation WHERE name = ?");
			statement.setString(1, sanitizeName(nation));
			result = statement.executeQuery();
			if (result.next()) {
				final String flag = result.getString(1);
				if (flag != null && !flag.trim().isEmpty()) {
					if (result.getByte(2) == 1) {
						//Return png copy, even if older jpg version
						if (flag.startsWith("http://www.nationstates.net/images/flags/Default")) {
							return "http://www.nationstates.net/images/flags/Default.png";
						}
						return flag;
					}
					return "http://www.nationstates.net/images/flags/exnation.png";
				}
			}
			return defaultFlag;
		} finally {
			DbUtils.closeQuietly(result);
			DbUtils.closeQuietly(statement);
		}
	}

	public static String getRegionFlag(String region, Connection conn) throws SQLException {
		return getRegionFlag(region, conn, "http://www.nationstates.net/images/flags/Default.png");
	}

	public static String getRegionFlag(String region, Connection conn, String defaultFlag) throws SQLException {
		PreparedStatement statement = null;
		ResultSet result = null;
		try {
			statement = conn.prepareStatement("SELECT flag, alive FROM assembly.region WHERE name = ?");
			statement.setString(1, sanitizeName(region));
			result = statement.executeQuery();
			if (result.next()) {
				final String flag = result.getString(1);
				if (flag != null && !flag.trim().isEmpty()) {
					if (result.getByte(2) == 1) {
						return flag;
					}
					return "http://nationstatesplusplus.com/nationstates/static/exregion.png";
				}
			}
			return defaultFlag;
		} finally {
			DbUtils.closeQuietly(result);
			DbUtils.closeQuietly(statement);
		}
	}

	public static String getPostValue(Http.Request request, String property) {
		Map<String, String[]> post = request.body().asFormUrlEncoded();
		String[] value = post.get(property);
		if (value != null && value.length > 0) {
			return value[0];
		}
		return null;
	}

	public static Result validateRequest(Http.Request request, Http.Response response, NationStates api, DatabaseAccess access) {
		return validateRequest(request, response, api, access, true);
	}

	public static Result validateRequest(Http.Request request, Http.Response response, NationStates api, DatabaseAccess access, boolean rateLimit) {
		String authToken = Utils.getPostValue(request, "auth-token");
		String nation = Utils.getPostValue(request, "nation");
		String auth = Utils.getPostValue(request, "auth");
		String reason = "UNKNOWN NATION ID";
		try {
			final int nationId = access.getNationIdCache().get(sanitizeName(nation));
			if (nation != null && nationId != -1) {
				if (authToken != null && access.isValidAuthToken(nationId, authToken)) {
					response.setHeader("Access-Control-Expose-Headers", "X-Auth-Token");
					response.setHeader("X-Auth-Token", authToken);
					return null;
				} else {
					reason = "INVALID AUTH TOKEN";
				}
				if (auth != null && (!rateLimit || recentAuthRequest.getIfPresent(nation) == null)) {
					recentAuthRequest.put(nation, true);
					boolean verify = false;
					try {
						verify = api.verifyNation(nation, auth);
					} catch (RateLimitReachedException e) {
						Logger.warn("Auth API Rate limited! Switching to backup...");
						verify = authAPI.verifyNation(nation, auth);
					}
					if (verify) {
						response.setHeader("Access-Control-Expose-Headers", "X-Auth-Token");
						response.setHeader("X-Auth-Token", access.generateAuthToken(nationId));
						Logger.info("Authenticated [" + nation + "] with NS Auth API");
						return null;
					} else {
						reason = "INVALID NS AUTH CODE";
						Logger.info("Failed to Authenticate [" + nation + "] with NS Auth API | Code: [" + auth + "]");
					}
				}
			}
		} catch (ExecutionException e) {
			Logger.error("Unable to validate request", e);
			reason = "UNKNOWN REASON";
		}
		Utils.handleDefaultPostHeaders(request, response);
		return Results.unauthorized(reason);
	}

	public static String uploadToImgur(String url, String clientKey) throws IOException {
		HttpsURLConnection conn = (HttpsURLConnection) (new URL("https://api.imgur.com/3/image")).openConnection();
		conn.addRequestProperty("Authorization", "Client-ID " + clientKey);
		conn.setDoInput(true);
		conn.setDoOutput(true);
		conn.setUseCaches(false);
		conn.setRequestMethod("POST");
		OutputStream out = null;
		try {
			out = conn.getOutputStream();
			IOUtils.write("image=" + EncodingUtil.encodeURIComponent(url) + "&type=URL", out);
			out.flush();
		} finally {
			IOUtils.closeQuietly(out);
		}

		InputStream stream = null;
		try {
			stream = conn.getInputStream();
			Map<String, Object> result = new ObjectMapper().readValue(stream, new TypeReference<HashMap<String,Object>>() {});
			@SuppressWarnings("unchecked")
			Map<String, Object> data = (Map<String, Object>) result.get("data");
			String link = (String) data.get("link");
			return link;
		} finally {
			IOUtils.closeQuietly(stream);
			conn.disconnect();
		}
	}

	public static void updateNation(final Connection conn, final DatabaseAccess access, final NationStates api, final String nation, final int id) throws Exception {
		NationData.Shards.CENSUS_SCORE.clearIds();
		for (int i = 0; i <= 70; i++) {
			NationData.Shards.CENSUS_SCORE.addIds(i);
		}
		try {
			NationData data = api.getNationInfo(nation, Shards.ENDORSEMENTS, Shards.WA_STATUS, Shards.INFLUENCE, Shards.CENSUS_SCORE, Shards.FLAG, Shards.FULL_NAME, Shards.NAME, Shards.LAST_LOGIN, Shards.REGION);

			PreparedStatement updateNation = conn.prepareStatement("UPDATE assembly.nation SET influence = ?, influence_desc = ?, flag = ?, full_name = ?, title = ?, last_login = ?, last_endorsement_baseline = ?, wa_member = ?, region = ? WHERE id = ?");
			updateNation.setInt(1, data.censusScore.get(65).intValue());
			updateNation.setString(2, data.influence);
			updateNation.setString(3, data.flagURL);
			updateNation.setString(4, data.fullName);
			updateNation.setString(5, data.name);
			updateNation.setLong(6, data.lastLogin);
			updateNation.setLong(7, System.currentTimeMillis());
			updateNation.setByte(8, (byte)(data.worldAssemblyStatus != WAStatus.NON_MEMBER ? 1 : 0));
			updateNation.setInt(9, access.getRegionIdCache().get(Utils.sanitizeName(data.region)));
			updateNation.setInt(10, id);
			updateNation.executeUpdate();
			DbUtils.closeQuietly(updateNation);
			
			updateShards(conn, data, id);
			updateEndorsements(conn, data, access, id);
		} catch (UnknownNationException e) {
			access.markNationDead(id, conn);
		}
	}

	private static void updateShards(final Connection conn, final NationData data, final int nationId) throws SQLException {
		StringBuilder statement = new StringBuilder("INSERT INTO assembly.nation_shards (nation, timestamp, ");
		for (int i = 0; i <= 70; i++) {
			statement.append("shard_").append(i);
			if ( i != 70 ) statement.append(", ");
		}
		statement.append(") VALUES (?, ?, ");
		for (int i = 0; i <= 70; i++) {
			statement.append("?");
			if ( i != 70 ) statement.append(", ");
		}
		statement.append(")");
		
		PreparedStatement insert = conn.prepareStatement(statement.toString());
		insert.setInt(1, nationId);
		insert.setLong(2, System.currentTimeMillis());
		for (int i = 0; i <= 70; i++) {
			insert.setFloat((3 + i), data.censusScore.get(i));
		}
		insert.executeUpdate();
	}

	public static void updateEndorsements(final Connection conn, final NationData data, final DatabaseAccess access, final int nationId) throws Exception {
		conn.setAutoCommit(false);
		Savepoint save =  conn.setSavepoint();
		try {
			PreparedStatement endorsements = conn.prepareStatement("INSERT INTO assembly.endorsements (endorser, endorsed) VALUES (?, ?)");
			for (String endorsed : data.endorsements) {
				if (endorsed.trim().length() > 0) {
					endorsements.setInt(1, access.getNationIdCache().get(endorsed));
					endorsements.setInt(2, nationId);
					endorsements.addBatch();
				}
			}

			PreparedStatement hasEndorsement = conn.prepareStatement("DELETE FROM assembly.endorsements WHERE endorsed = ?");
			hasEndorsement.setInt(1, nationId);
			hasEndorsement.executeUpdate();
			DbUtils.closeQuietly(hasEndorsement);
			
			endorsements.executeBatch();
			DbUtils.closeQuietly(endorsements);
			
			PreparedStatement updateEndorsementTrends = conn.prepareStatement("INSERT INTO assembly.nation_endorsement_trends (nation, endorsements, timestamp) VALUES (?, ?, ?)");
			updateEndorsementTrends.setInt(1, nationId);
			updateEndorsementTrends.setInt(2, data.endorsements.length);
			updateEndorsementTrends.setLong(3, System.currentTimeMillis());
			updateEndorsementTrends.executeUpdate();
			DbUtils.closeQuietly(updateEndorsementTrends);
			
			conn.commit();
			conn.releaseSavepoint(save);
		} catch (Exception e) {
			conn.rollback(save);
			Logger.error("Rolling back endorsement transaction");
			throw e;
		} finally {
			conn.setAutoCommit(true);
		}
	}
}
