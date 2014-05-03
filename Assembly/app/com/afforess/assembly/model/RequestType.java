package com.afforess.assembly.model;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

import play.libs.Json;

import com.afforess.assembly.model.page.NationStatesPage;
import com.afforess.assembly.model.page.RegionPage;
import com.fasterxml.jackson.databind.JsonNode;

import controllers.NewspaperController;
import controllers.RMBController;
import controllers.RegionController;

public enum RequestType {
	REGION_TITLE("region_titles"),
	REGION_MAP("region_map"),
	REGION_UPDATES("region_updates"),
	REGION_NEWSPAPER("region_newspaper"),
	REGION_EMBASSIES("region_embassies"),
	RMB_RATINGS("rmb_ratings")
	
	;

	private static final Map<String, RequestType> types = new HashMap<String, RequestType>();
	private final String name;

	RequestType(String name) {
		this.name = name;
	}

	public String getType() {
		return name;
	}

	public boolean shouldSendData(NationSettings settings) {
		switch(this) {
			case REGION_EMBASSIES:
				return settings.getValue("embassy_flags", true, Boolean.class);
			default:
				return true;
		}
	}

	public JsonNode executeRequest(Connection conn, DataRequest request, String nation, int nationId, NationStatesPage page) throws SQLException {
		return wrapJson(executeRequestImpl(conn, request, nation, nationId, page));
	}

	private JsonNode executeRequestImpl(Connection conn, DataRequest request, String nation, int nationId, NationStatesPage page) throws SQLException {
		switch(this) {
			case REGION_TITLE:
				if (page instanceof RegionPage) {
					return RegionController.getRegionalTitles(conn, ((RegionPage)page).getRegion());
				}
			case REGION_EMBASSIES:
				if (page instanceof RegionPage) {
					return RegionController.getEmbassies(conn, ((RegionPage)page).getRegion());
				}
			case REGION_MAP:
				if (page instanceof RegionPage) {
					return RegionController.getRegionalMap(conn, ((RegionPage)page).getRegion());
				}
			case REGION_NEWSPAPER:
				if (page instanceof RegionPage) {
					return NewspaperController.getNewspaper(conn, ((RegionPage)page).getRegion());
				}
			case REGION_UPDATES:
				if (page instanceof RegionPage) {
					return RegionController.getUpdateTime(conn, ((RegionPage)page).getRegionId(), 2);
				}
			case RMB_RATINGS:
				if (request != null) {
					Integer postId = request.getValue("rmb_post_id", null, Integer.class);
					if (postId != null) {
						return RMBController.calculatePostRatings(conn, postId);
					}
				}
				return generateError("invalid post id", request);
			default:
				throw new IllegalStateException("Unimplemented RequestType: " + name());
		}
	}

	private static JsonNode generateError(String errorMsg, DataRequest request) {
		return Json.toJson("{\"error\":\"" + errorMsg + "\",\"request\":\"" + request.getName() + "\"");
	}

	public JsonNode wrapJson(JsonNode node) {
		Map<String, JsonNode> json = new HashMap<String, JsonNode>(1);
		json.put(name, node);
		return Json.toJson(json);
	}

	public static RequestType getTypeForName(String name) {
		return types.get(name);
	}

	static {
		for (RequestType t : values()) {
			types.put(t.name, t);
		}
	}
}
