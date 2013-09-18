package com.afforess.assembly.util;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.commons.lang.WordUtils;
import org.joda.time.DateTime;
import org.joda.time.format.DateTimeFormatter;
import org.joda.time.format.DateTimeFormatterBuilder;

import com.limewoodMedia.nsapi.NationStates;

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


	public static Result handleDefaultGetHeaders(Request request, Response response, String calculatedEtag) {
		return handleDefaultGetHeaders(request, response, calculatedEtag, "60");
	}

	public static Result handleDefaultGetHeaders(Request request, Response response, String calculatedEtag, String seconds) {
		response.setHeader("Access-Control-Allow-Origin", "*");
		response.setHeader("Access-Control-Allow-Methods", "POST, GET, HEAD");
		response.setHeader("Access-Control-Max-Age", seconds);
		response.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		response.setHeader("Cache-Control", "public, max-age=" + seconds);
		response.setHeader("Expires", new DateTime().plusHours(1).toString(Utils.HTTP_DATE_TIME));
		response.setHeader("Last-Modified", new DateTime().plusHours(-1).toString(Utils.HTTP_DATE_TIME));
		response.setHeader("Vary", "Accept-Encoding");
		response.setHeader("ETag", calculatedEtag);

		String eTag = request.getHeader("If-None-Match");
		if (calculatedEtag != null && calculatedEtag.equals(eTag)) {
			return Results.status(304);
		}
		return null;
	}

	public static void handleDefaultPostHeaders(Request request, Response response) {
		response.setHeader("Access-Control-Allow-Origin", "*");
		response.setHeader("Access-Control-Allow-Methods", "POST, GET, HEAD");
		response.setHeader("Access-Control-Max-Age", "60");
		response.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	}

	public static String formatHappeningText(String text, NationCache cache, Connection conn, boolean longNames, String owner) throws SQLException {
		text = text.replaceAll("%%capitalist_paradise%rmb%%", "<a href=\"http://www.nationstates.net/region=capitalist_paradise#rmb \">Regional Message Board</a>");
		boolean firstName = true;
		do {
			Matcher match = NATION_PATTERN.matcher(text);
			if (match.find()) {
				String nation = text.substring(match.start() + 2, match.end() - 2);
				String replacement = "<a href=\"http://www.nationstates.net/nation=" + nation + "\">" + (longNames ? formatFullName(nation, cache, conn, firstName || owner.equals(nation)) : formatName(nation)) + "</a>";
				text = match.replaceFirst(replacement);
				firstName = false;
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

	public static String formatFullName(String nation, NationCache cache, Connection conn, boolean shortName) throws SQLException {
		String fullName = shortName ? formatName(nation) : getFullName(nation, cache, conn);
		String flag = getNationFlag(nation, cache, conn);
		return "<img src=\"" + flag + "\" class=\"miniflag\" alt=\"\" title=\"" + fullName + "\">" + fullName;
	}

	public static String getFullName(String nation, NationCache cache, Connection conn) throws SQLException {
		int id = cache.getNationId(nation);
		if (id == -1) {
			return formatName(nation);
		}
		PreparedStatement statement = conn.prepareStatement("SELECT formatted_name from assembly.nation WHERE id = ?");
		statement.setInt(1, id);
		ResultSet result = statement.executeQuery();
		result.next();
		return result.getString(1);
	}

	public static String formatName(String nation) {
		return WordUtils.capitalizeFully(nation.replaceAll("_", " "));
	}

	public static String getNationFlag(String nation, NationCache cache, Connection conn) throws SQLException {
		int id = cache.getNationId(nation);
		if (id > -1) {
			PreparedStatement statement = conn.prepareStatement("SELECT flag from assembly.nation WHERE id = ?");
			statement.setInt(1, id);
			ResultSet result = statement.executeQuery();
			result.next();
			return result.getString(1);
		}
		return "http://www.nationstates.net/images/flags/default.jpg";
	}

	public static String getPostValue(Http.Request request, String property) {
		try {
			return request.body().asFormUrlEncoded().get(property)[0];
		} catch (Exception e) {
			return null;
		}
	}

	public static Result validateRequest(Http.Request request, Http.Response response, NationStates api, NationCache cache) {
		String authToken = Utils.getPostValue(request, "auth-token");
		String nation = Utils.getPostValue(request, "nation");
		String auth = Utils.getPostValue(request, "auth");
		final int nationId = cache.getNationId(nation);
		if (nation != null && nationId != -1) {
			if (authToken != null && cache.isValidAuthToken(nationId, authToken)) {
				return null;
			}
			if (auth != null && api.verifyNation(nation, auth)) {
				response.setHeader("X-Auth-Token", cache.generateAuthToken(nationId));
				return null;
			}
		}
		Utils.handleDefaultPostHeaders(request, response);
		return Results.unauthorized();
	}

	public static Result verifyNation(Http.Request request, Http.Response response, NationStates api, NationCache cache) {
		String auth = Utils.getPostValue(request, "auth");
		String nation = Utils.getPostValue(request, "nation");
		if (auth == null || nation == null || cache.getNationId(nation) == -1) {
			Utils.handleDefaultPostHeaders(request, response);
			return Results.badRequest();
		}
		if (!api.verifyNation(nation, auth)) {
			Utils.handleDefaultPostHeaders(request, response);
			return Results.unauthorized();
		}
		return null;
	}
}
