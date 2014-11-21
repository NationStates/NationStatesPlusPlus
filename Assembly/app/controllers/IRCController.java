package controllers;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;

import net.nationstatesplusplus.assembly.auth.Authentication;
import net.nationstatesplusplus.assembly.util.DatabaseAccess;
import net.nationstatesplusplus.assembly.util.Utils;

import org.spout.cereal.config.yaml.YamlConfiguration;

import com.limewoodMedia.nsapi.NationStates;
import play.libs.Json;
import play.mvc.Result;
import play.mvc.Results;

public class IRCController extends NationStatesController {

	public IRCController(DatabaseAccess access, YamlConfiguration config, NationStates api) {
		super(access, config, api);
	}

	public Result getIRCNetwork(String region) throws SQLException {
		Utils.handleDefaultPostHeaders(request(), response());
		int regionId = getDatabase().getRegionId(region);
		if (regionId == -1) {
			return Results.badRequest("Invalid region");
		}
		try (Connection conn = this.getConnection()) {
			try (PreparedStatement select = conn.prepareStatement("SELECT irc_network, irc_channel, irc_port FROM assembly.irc_networks WHERE region = ?")) {
				select.setInt(1, regionId);
				try (ResultSet result = select.executeQuery()) {
					if (result.next()) {
						HashMap<String, Object> ircNetwork = new HashMap<>();
						ircNetwork.put("irc_network", result.getString(1));
						ircNetwork.put("irc_channel", result.getString(2));
						ircNetwork.put("irc_port", result.getInt(3));
						return Results.ok(Json.toJson(ircNetwork)).as("application/json");
					}
				}
			}
		}
		return Results.noContent();
	}

	public Result setIRCNetwork(String region) throws SQLException {
		Utils.handleDefaultPostHeaders(request(), response());
		final int regionId = getDatabase().getRegionId(region);
		if (regionId == -1) {
			return Results.badRequest("Invalid region");
		}
		final String nation = Utils.getPostValue(request(), "nation");
		if (nation == null || nation.isEmpty()) {
			return Results.badRequest();
		}
		final int nationId = getDatabase().getNationId(nation);
		if (nationId == -1) {
			return Results.badRequest();
		}
		final String ircNetwork = Utils.getPostValue(request(), "irc_network");
		final String ircChannel = Utils.getPostValue(request(), "irc_channel");
		final String ircPort = Utils.getPostValue(request(), "irc_port");
		if (ircNetwork == null || ircNetwork.isEmpty() || ircChannel == null || ircChannel.isEmpty() || ircPort == null || ircPort.isEmpty()) {
			return Results.badRequest("Missing irc network, irc channel");
		}
		String authToken = Utils.getPostValue(request(), "rss_token");
		if (authToken == null || authToken.isEmpty()) {
			return Results.badRequest("Missing authentication");
		}
		int rssToken;
		try {
			rssToken = Integer.parseInt(authToken);
		} catch (NumberFormatException e) {
			return Results.unauthorized("Malformed rss token, expected integer");
		}
		
		Authentication auth = new Authentication(Utils.sanitizeName(nation), nationId, rssToken, this.getDatabase());
		if (!auth.isValid()) {
			return Results.unauthorized("Invalid rss token");
		}
		
		boolean validAdministrator = false;
		try (Connection conn = this.getConnection()) {
			try (PreparedStatement select = conn.prepareStatement("SELECT founder, delegate FROM assembly.region WHERE id = ?")) {
				select.setInt(1, regionId);
				try (ResultSet result = select.executeQuery()) {
					if (result.next()) {
						validAdministrator = nation.equalsIgnoreCase(result.getString(1)) || nation.equalsIgnoreCase(result.getString(2));
					}
				}
			}

			if (!validAdministrator) {
				return Results.unauthorized("You lack permission to edit " + region + "'s irc settings");
			}

			try (PreparedStatement delete = conn.prepareStatement("DELETE FROM assembly.irc_networks WHERE region = ?")) {
				delete.setInt(1, regionId);
				delete.executeQuery();
			}
			try (PreparedStatement insert = conn.prepareStatement("INSERT INTO assembly.irc_networks (region, irc_network, irc_channel, irc_port) VALUES (?, ?, ?, ?)")) {
				insert.setInt(1, regionId);
				insert.setString(2, ircNetwork);
				insert.setString(3, ircChannel);
				insert.setInt(4, Integer.parseInt(ircPort));
				insert.executeQuery();
			}
		}
		return Results.noContent();
	}
}
