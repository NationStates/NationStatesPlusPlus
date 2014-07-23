package controllers;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;

import net.nationstatesplusplus.assembly.util.DatabaseAccess;
import net.nationstatesplusplus.assembly.util.EncodingUtil;
import net.nationstatesplusplus.assembly.util.Utils;

import org.apache.commons.io.IOUtils;
import org.spout.cereal.config.ConfigurationNode;
import org.spout.cereal.config.yaml.YamlConfiguration;

import play.Logger;
import play.mvc.Result;
import play.mvc.Results;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.limewoodMedia.nsapi.NationStates;

public class XenforoController  extends NationStatesController {
	private final String xenforoKey;
	public XenforoController(DatabaseAccess access, YamlConfiguration config, NationStates api) {
		super(access, config, api);
		ConfigurationNode xenforoAuth = getConfig().getChild("xenforo");
		xenforoKey = xenforoAuth.getChild("api-key").getString(null);
	}

	public Result verifyNationLogin() throws IOException {
		Result ret = Utils.validateRequest(request(), response(), getAPI(), getDatabase(), false);
		if (ret != null) {
			return ret;
		}
		String nation = Utils.getPostValue(request(), "nation");
		String password = Utils.getPostValue(request(), "password");
		if (password == null || password.isEmpty() || password.length() > 40) {
			return Results.badRequest("Invalid password");
		}
		HttpURLConnection conn = (HttpURLConnection) (new URL("http://capitalistparadise.com/forums/api.php?action=editUser&hash=" + xenforoKey + "&user=" + EncodingUtil.encodeURIComponent(nation) + "&password=" + EncodingUtil.encodeURIComponent(password))).openConnection();
		InputStream stream = null;
		try {
			final int response = conn.getResponseCode();
			if (response / 100 == 2) {
				stream = conn.getInputStream();
				Map<String, Object> result = new ObjectMapper().readValue(stream, new TypeReference<HashMap<String,Object>>() {});
				Logger.info("Verifying Xenforo Nation Login: " + nation);
				Logger.info("Verify Xenforo Nation Login: " + result);
			} else {
				stream = conn.getErrorStream();
				Map<String, Object> result = new ObjectMapper().readValue(stream, new TypeReference<HashMap<String,Object>>() {});
				Logger.warn("Failed Xenforo User Login: " + nation);
				Logger.warn("Failed Xenforo User Login: " + result);
				if (result.containsKey("user_error_phrase")) {
					return Results.badRequest((String)result.get("user_error_phrase")).as("application/json");
				}
				return Results.badRequest("Unknown error occured").as("application/json");
			}
		} finally {
			IOUtils.closeQuietly(stream);
			conn.disconnect();
		}
		return Results.ok();
	}

	public Result createXenforoUser() throws IOException {
		Result ret = Utils.validateRequest(request(), response(), getAPI(), getDatabase(), false);
		if (ret != null) {
			return ret;
		}
		String nation = Utils.getPostValue(request(), "nation");
		String password = Utils.getPostValue(request(), "password");
		if (password == null || password.isEmpty() || password.length() > 40) {
			return Results.badRequest("Invalid password");
		}
		String email = Utils.getPostValue(request(), "email");
		if (email == null) {
			email = Utils.sanitizeName(nation) + "@mailinator.com";
		}

		HttpURLConnection conn = (HttpURLConnection) (new URL("http://capitalistparadise.com/forums/api.php?action=register&hash=" + xenforoKey + "&username=" + EncodingUtil.encodeURIComponent(nation) + "&password=" + EncodingUtil.encodeURIComponent(password) + 
																"&user_state=valid&add_groups=8&custom_fields=nationstates=" + EncodingUtil.encodeURIComponent(nation) + "&email=" + EncodingUtil.encodeURIComponent(email))).openConnection();
		InputStream stream = null;
		try {
			final int response = conn.getResponseCode();
			if (response / 100 == 2) {
				stream = conn.getInputStream();
				Map<String, Object> result = new ObjectMapper().readValue(stream, new TypeReference<HashMap<String,Object>>() {});
				Logger.info("Verifying Xenforo User Creation: " + nation);
				Logger.info("Verify Xenforo User Creation: " + result);
			} else {
				stream = conn.getErrorStream();
				Map<String, Object> result = new ObjectMapper().readValue(stream, new TypeReference<HashMap<String,Object>>() {});
				Logger.warn("Failed Xenforo User Creation: " + nation);
				Logger.warn("Failed Xenforo User Creation: " + result);
				if (result.containsKey("user_error_phrase")) {
					return Results.badRequest((String)result.get("user_error_phrase")).as("application/json");
				}
				return Results.badRequest("Unknown error occured").as("application/json");
			}
		} finally {
			IOUtils.closeQuietly(stream);
			conn.disconnect();
		}
		return Results.ok();
	}
}
