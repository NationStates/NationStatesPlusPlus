package controllers;

import java.util.concurrent.ExecutionException;

import org.spout.cereal.config.yaml.YamlConfiguration;

import com.afforess.assembly.model.page.DefaultPage;
import com.afforess.assembly.model.page.RegionPage;
import com.afforess.assembly.model.websocket.NationStatesWebSocket;
import com.afforess.assembly.util.DatabaseAccess;
import com.afforess.assembly.util.Utils;
import com.fasterxml.jackson.databind.JsonNode;

import play.mvc.WebSocket;

public class WebSocketController extends DatabaseController {
	public WebSocketController(DatabaseAccess access, YamlConfiguration config) {
		super(access, config);
	}

	public WebSocket<JsonNode> index(String nation) throws ExecutionException {
		if (nation.isEmpty()) return null;
		nation = Utils.sanitizeName(nation);
		return new NationStatesWebSocket(this.getDatabase(), new DefaultPage(), nation);
	}

	public WebSocket<JsonNode> region(String nation, String region) throws ExecutionException {
		if (nation.isEmpty() || region.isEmpty()) return null;
		region = Utils.sanitizeName(region);
		nation = Utils.sanitizeName(nation);
		return new NationStatesWebSocket(this.getDatabase(), new RegionPage(region, getDatabase().getRegionId(region)), nation);
	}
}
