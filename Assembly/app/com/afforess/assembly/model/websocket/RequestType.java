package com.afforess.assembly.model.websocket;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

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
	RMB_RATINGS("rmb_ratings"),
	GAMEPLAY_NEWS_SIDEBAR("gameplay_news_sidebar"),
	ROLEPLAY_NEWS_SIDEBAR("roleplay_news_sidebar"),
	REGIONAL_NEWS_SIDEBAR("regional_news_sidebar"),
	PENDING_NEWS_SUBMISSIONS("pending_news_submissions"),
	;

	private static final Map<String, RequestType> types = new HashMap<String, RequestType>();
	private final String name;

	RequestType(String name) {
		this.name = name;
	}

	public String getType() {
		return name;
	}

	public boolean shouldSendData(NationContext context) {
		switch(this) {
			case REGION_EMBASSIES:
				return context.getSettings().getValue("embassy_flags", true, Boolean.class);
			case GAMEPLAY_NEWS_SIDEBAR:
				return context.getSettings().getValue("show_gameplay_news", true, Boolean.class);
			case ROLEPLAY_NEWS_SIDEBAR:
				return context.getSettings().getValue("show_roleplay_news", true, Boolean.class);
			case REGIONAL_NEWS_SIDEBAR:
				return context.getSettings().getValue("show_regional_news", true, Boolean.class);
			default:
				return true;
		}
	}

	public JsonNode executeRequest(Connection conn, DataRequest request, NationContext context) throws SQLException, ExecutionException {
		return wrapJson(executeRequestImpl(conn, request, context));
	}

	private JsonNode executeRequestImpl(Connection conn, DataRequest request, NationContext context) throws SQLException, ExecutionException {
		final NationStatesPage page = context.getActivePage();
		switch(this) {
			case REGION_TITLE:
				if (page instanceof RegionPage) {
					return RegionController.getRegionalTitles(conn, ((RegionPage)page).getRegion());
				}
			case REGION_EMBASSIES:
				if (page instanceof RegionPage) {
					return RegionController.getEmbassies(conn, ((RegionPage)page).getRegion(), 25);
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
			case GAMEPLAY_NEWS_SIDEBAR:
				return NewspaperController.getLatestUpdate(conn, NewspaperController.GAMEPLAY_NEWS);
			case ROLEPLAY_NEWS_SIDEBAR:
				return NewspaperController.getLatestUpdate(conn, NewspaperController.ROLEPLAY_NEWS);
			case REGIONAL_NEWS_SIDEBAR:
				return NewspaperController.getLatestUpdate(conn, context.getAccess().getNationLocation().get(context.getNationId()));
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
