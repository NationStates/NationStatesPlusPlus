package controllers;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import org.joda.time.Duration;
import org.json.JSONException;
import org.json.JSONObject;
import org.spout.cereal.config.yaml.YamlConfiguration;

import com.afforess.assembly.util.DatabaseAccess;
import com.afforess.assembly.util.Utils;
import com.firebase.security.token.TokenGenerator;
import com.firebase.security.token.TokenOptions;
import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import com.limewoodMedia.nsapi.NationStates;

import play.Logger;
import play.mvc.*;
import play.libs.Json;

public class FirebaseAuthenticator extends DatabaseController {
	private final String token;
	private final NationStates api;
	private final Cache<String, Boolean> recentAuthRequest;
	public FirebaseAuthenticator(DatabaseAccess access, YamlConfiguration config, String token, NationStates api) {
		super(access, config);
		this.token = token;
		this.api = api;
		this.recentAuthRequest = CacheBuilder.newBuilder().maximumSize(250).expireAfterWrite(1, TimeUnit.MINUTES).build();
	}

	public Result requestAuthentication() {
		String nation = Utils.getPostValue(request(), "nation");
		String auth = Utils.getPostValue(request(), "auth");
		if (nation != null && auth != null && !"undefined".equals(auth) && recentAuthRequest.getIfPresent(nation) == null) {
			recentAuthRequest.put(nation, true);
			if (api.verifyNation(nation, auth)) {
				TokenGenerator tokenGenerator = new TokenGenerator(token);
				TokenOptions tokenOptions = new TokenOptions();
				tokenOptions.setExpires(new Date(System.currentTimeMillis() + Duration.standardDays(30).getMillis()));
				JSONObject arbitraryPayload = new JSONObject();
				try {
					arbitraryPayload.put("user", nation);
				} catch (JSONException e) {
					throw new RuntimeException(e);
				}
				String token = tokenGenerator.createToken(arbitraryPayload, tokenOptions);
				
				Map<String, String> result = new HashMap<String, String>(2);
				result.put("nation", nation);
				result.put("token", token);
				
				Utils.handleDefaultPostHeaders(request(), response());
				return ok(Json.toJson(result)).as("application/json");
			} else {
				Logger.warn("Nation: " + nation + " with auth token: " + auth + " failed to authenticate!");
			}
		}
		return Results.unauthorized();
	}
}
