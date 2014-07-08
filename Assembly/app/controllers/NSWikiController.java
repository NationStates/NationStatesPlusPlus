package controllers;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.math.BigInteger;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

import net.sourceforge.jwbf.core.RequestBuilder;
import net.sourceforge.jwbf.core.actions.util.HttpAction;
import net.sourceforge.jwbf.mediawiki.ApiRequestBuilder;
import net.sourceforge.jwbf.mediawiki.actions.util.MWAction;
import net.sourceforge.jwbf.mediawiki.bots.MediaWikiBot;

import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.dbutils.DbUtils;
import org.spout.cereal.config.ConfigurationNode;
import org.spout.cereal.config.yaml.YamlConfiguration;

import play.Logger;
import play.mvc.Result;
import play.mvc.Results;

import com.afforess.assembly.util.DatabaseAccess;
import com.afforess.assembly.util.Utils;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.limewoodMedia.nsapi.NationStates;

public class NSWikiController  extends NationStatesController {
	private final String nswikiAdmin;
	private final String nswikiPass;
	public NSWikiController(DatabaseAccess access, YamlConfiguration config, NationStates api) {
		super(access, config, api);
		ConfigurationNode nswiki = getConfig().getChild("nswiki");
		nswikiAdmin = nswiki.getChild("admin").getString(null);
		nswikiPass = nswiki.getChild("password").getString(null);
	}

	public Result verifyNationLogin() throws IOException, SQLException {
		Utils.handleDefaultPostHeaders(request(), response());
		Result ret = Utils.validateRequest(request(), response(), getAPI(), getDatabase(), false);
		if (ret != null) {
			return ret;
		}
		String nation = Utils.getPostValue(request(), "nation");
		String password = Utils.getPostValue(request(), "password");
		if (password == null || password.isEmpty() || password.length() < 8) {
			Logger.warn("NSWiki User [" + nation + "] attempted an invalid password: [" + password + "]");
			return Results.badRequest("Invalid password");
		}
		Logger.info("Attempting NSWiki login for " + nation);
		final String title;
		Connection conn = null;
		PreparedStatement select = null;
		ResultSet set = null;
		try {
			conn = getConnection();
			select = conn.prepareStatement("SELECT title FROM assembly.nation WHERE name = ?");
			select.setString(1, Utils.sanitizeName(nation));
			set = select.executeQuery();
			set.next();
			title = set.getString(1);
			
			if (doesNSWikiUserExist(title)) {
				Logger.info("NSWiki Updating password for " + title);
				if (changePassword(conn, title, password)) {
					return Results.ok();
				}
				return Results.internalServerError("Unable to change password for " + title);
			}
		} finally {
			DbUtils.closeQuietly(conn);
			DbUtils.closeQuietly(select);
			DbUtils.closeQuietly(set);
		}
		return createNSWikiUser(title, password);
	}

	private static boolean changePassword(Connection conn, String user, String password) throws SQLException {
		final String salt = new BigInteger(31, new Random()).toString(16);
		final String hash = ":B:" + salt + ":" + DigestUtils.md5Hex(salt + "-" + DigestUtils.md5Hex(password));
		PreparedStatement update = conn.prepareStatement("UPDATE nswiki.user SET user_password = ? WHERE user_name = ?");
		update.setString(1, hash);
		update.setString(2, user);
		return update.executeUpdate() == 1;
	}

	private static boolean doesNSWikiUserExist(String user) throws IOException {
		URL userPage = new URL("http://nswiki.org/index.php?title=User:" + URLEncoder.encode(user, "UTF-8"));
		HttpURLConnection conn = (HttpURLConnection) userPage.openConnection();
		conn.connect();
		return conn.getResponseCode() / 100 == 2;
	}

	private Result createNSWikiUser(String nation, String password) throws IOException {
		MediaWikiBot wikibot = new MediaWikiBot("http://nswiki.org/");
		wikibot.login(nswikiAdmin, nswikiPass);
		String result = wikibot.performAction(new CreateUser(nation, password));
		if (result.contains("success")) {
			return Results.ok();
		} else {
			Logger.warn("Unable to create NSWiki user: " + result);
			return Results.internalServerError();
		}
	}

	private static class CreateUser extends MWAction {
		private String token = null;
		private int count = 0;
		private final String name;
		private final String password;
		public CreateUser(String name, String password) {
			this.name = name;
			this.password = password;
		}

		@Override
		public HttpAction getNextMessage() {
			try {
				RequestBuilder rb = new ApiRequestBuilder().action("createaccount").param("format", "json").param("name", URLEncoder.encode(name, "UTF-8")).param("password", URLEncoder.encode(password, "UTF-8"));
				if (token != null) {
					rb.param("token", token);
				}
				return rb.buildPost();
			} catch (UnsupportedEncodingException e) {
				throw new RuntimeException(e);
			}
		}

		@SuppressWarnings("unchecked")
		@Override
		public String processAllReturningText(final String s) {
			try {
				if (token == null) {
					Map<String, Object> result = new ObjectMapper().readValue(s, new TypeReference<HashMap<String,Object>>() {});
					token = ((Map<String, String>)result.get("createaccount")).get("token");
				}
			} catch (Exception e) {
				throw new RuntimeException(e);
			}
			return s;
		}

		@Override
		public boolean hasMoreMessages() {
			if (++count < 3) {
				return true;
			}
			return false;
		}
	}

}
