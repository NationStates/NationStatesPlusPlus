package controllers;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import org.joda.time.Duration;
import org.json.JSONException;
import org.json.JSONObject;

import com.afforess.assembly.util.NationCache;
import com.afforess.assembly.util.RegionCache;
import com.afforess.assembly.util.Utils;
import com.firebase.security.token.TokenGenerator;
import com.firebase.security.token.TokenOptions;
import com.limewoodMedia.nsapi.NationStates;
import com.mchange.v2.c3p0.ComboPooledDataSource;

import play.Logger;
import play.mvc.*;
import play.libs.Json;

public class FirebaseAuthenticator extends DatabaseController {
	private final String token;
	private final NationStates api;
	public FirebaseAuthenticator(ComboPooledDataSource pool, NationCache cache, RegionCache regionCache, String token, NationStates api) {
		super(pool, cache, regionCache);
		this.token = token;
		this.api = api;
	}

	public Result requestAuthentication() {
		String nation = Utils.getPostValue(request(), "nation");
		String auth = Utils.getPostValue(request(), "auth");
		if (nation != null && auth != null && !"undefined".equals(auth)) {
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
				
				response().setHeader("Access-Control-Allow-Origin", "*");
				response().setHeader("Access-Control-Allow-Methods", "POST, GET, HEAD");
				response().setHeader("Access-Control-Max-Age", "300");
				response().setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
				return ok(Json.toJson(result)).as("application/json");
			} else {
				Logger.warn("Nation: " + nation + " with auth token: " + auth + " failed to authenticate!");
			}
		}
		return Results.unauthorized();
	}
}
