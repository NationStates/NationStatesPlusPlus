package controllers;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.spout.cereal.config.yaml.YamlConfiguration;

import com.afforess.assembly.model.NationStatesWebSocket;
import com.afforess.assembly.model.page.RegionPage;
import com.afforess.assembly.util.DatabaseAccess;
import com.afforess.assembly.util.Utils;
import com.fasterxml.jackson.databind.JsonNode;

import play.Logger;
import play.libs.Json;
import play.libs.F.Callback;
import play.mvc.WebSocket;

public class WebSocketController extends DatabaseController {
	public WebSocketController(DatabaseAccess access, YamlConfiguration config) {
		super(access, config);
	}

	public WebSocket<JsonNode> index() {
		return new WebSocket<JsonNode>() {
			@Override
			public void onReady(final WebSocket.In<JsonNode> in, final WebSocket.Out<JsonNode> out) {
				in.onMessage(new Callback<JsonNode>() {
					@Override
					public void invoke(JsonNode a) throws Throwable {
						JsonNode page = a.get("page");
						Logger.info("WS Page: " + page);
						String pageName = page.asText();
						Logger.info("WS Page Name: " + pageName);
						Map<String, String> data = new HashMap<String, String>();
						data.put("data", "Hello World!");
						out.write(Json.toJson(data));
					}
				});
			}
		};
	}

	public WebSocket<JsonNode> region(String nation, String region) throws ExecutionException {
		if (nation.isEmpty() || region.isEmpty()) return null;
		region = Utils.sanitizeName(region);
		nation = Utils.sanitizeName(nation);
		return new NationStatesWebSocket(this.getDatabase(), new RegionPage(region, getDatabase().getRegionIdCache().get(region)), nation);
	}
}
