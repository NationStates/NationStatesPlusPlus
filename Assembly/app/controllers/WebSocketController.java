package controllers;

import net.nationstatesplusplus.assembly.model.page.DefaultPage;
import net.nationstatesplusplus.assembly.model.page.NationPage;
import net.nationstatesplusplus.assembly.model.page.RecruitmentAdministrationPage;
import net.nationstatesplusplus.assembly.model.page.RegionPage;
import net.nationstatesplusplus.assembly.model.websocket.NationStatesWebSocket;
import net.nationstatesplusplus.assembly.util.DatabaseAccess;

import org.spout.cereal.config.yaml.YamlConfiguration;

import com.fasterxml.jackson.databind.JsonNode;

import play.mvc.WebSocket;
import static net.nationstatesplusplus.assembly.util.Utils.sanitizeName;

public class WebSocketController extends DatabaseController {
	public WebSocketController(DatabaseAccess access, YamlConfiguration config) {
		super(access, config);
	}

	public WebSocket<JsonNode> index(String user, String userRegion, boolean reconnect) {
		if (user.isEmpty() || userRegion.isEmpty()) return null;
		return new NationStatesWebSocket(this.getDatabase(), new DefaultPage(), sanitizeName(user), sanitizeName(userRegion), reconnect);
	}

	public WebSocket<JsonNode> region(String nation, String userRegion, String region, boolean reconnect) {
		if (nation.isEmpty() || userRegion.isEmpty() || region.isEmpty()) return null;
		region = sanitizeName(region);
		return new NationStatesWebSocket(this.getDatabase(), new RegionPage(region, getDatabase().getRegionId(region)), sanitizeName(nation), sanitizeName(userRegion), reconnect);
	}

	public WebSocket<JsonNode> nation(String nation, String userRegion, String visibleNation, boolean reconnect) {
		if (nation.isEmpty() || userRegion.isEmpty() || visibleNation.isEmpty()) return null;
		visibleNation = sanitizeName(visibleNation);
		return new NationStatesWebSocket(this.getDatabase(), new NationPage(visibleNation, getDatabase().getNationId(visibleNation)), sanitizeName(nation), sanitizeName(userRegion), reconnect);
	}

	public WebSocket<JsonNode> recruitmentAdmin(String nation, String userRegion, String adminRegion, boolean reconnect) {
		if (nation.isEmpty() || userRegion.isEmpty() || adminRegion.isEmpty()) return null;
		return new NationStatesWebSocket(this.getDatabase(), new RecruitmentAdministrationPage(adminRegion, getDatabase().getRegionId(adminRegion)), sanitizeName(nation), sanitizeName(userRegion), reconnect);
	}
}
