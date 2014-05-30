package com.afforess.assembly.model.websocket;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
	RMB_POST("rmb_post"),
	REGION_POPULATION("region_record_population"),
	;

	private static final Map<String, RequestType> types = new HashMap<String, RequestType>();
	private final String name;

	RequestType(String name) {
		this.name = name;
	}

	public String getType() {
		return name;
	}

	public boolean shouldSendData(Connection conn, NationContext context) throws SQLException {
		switch(this) {
			case REGION_EMBASSIES:
				return context.getSettings().getValue("embassy_flags", true, Boolean.class);
			case GAMEPLAY_NEWS_SIDEBAR:
				return context.getSettings().getValue("show_gameplay_news", true, Boolean.class);
			case ROLEPLAY_NEWS_SIDEBAR:
				return context.getSettings().getValue("show_roleplay_news", true, Boolean.class);
			case REGIONAL_NEWS_SIDEBAR:
				return context.getSettings().getValue("show_regional_news", true, Boolean.class);
			case PENDING_NEWS_SUBMISSIONS:
				return !NewspaperController.getEditorshipsOfNation(context.getNationId(), conn).isEmpty();
			default:
				return true;
		}
	}

	public List<JsonNode> executeRequest(Connection conn, DataRequest request, NationContext context) throws SQLException, ExecutionException {
		List<JsonNode> nodes = executeRequestImpl(conn, request, context);
		final int size = nodes.size();
		for (int i = 0; i < size; i++) {
			nodes.set(i, wrapJson(nodes.get(i)));
		}
		return nodes;
	}

	private List<JsonNode> executeRequestImpl(Connection conn, DataRequest request, NationContext context) throws SQLException, ExecutionException {
		final NationStatesPage page = context.getActivePage();
		switch(this) {
			case REGION_TITLE:
				if (page instanceof RegionPage) {
					return toList(RegionController.getRegionalTitles(conn, ((RegionPage)page).getRegion()));
				}
			case REGION_EMBASSIES:
				if (page instanceof RegionPage) {
					return toList(RegionController.getEmbassies(conn, ((RegionPage)page).getRegion(), 25));
				}
			case REGION_MAP:
				if (page instanceof RegionPage) {
					return toList(RegionController.getRegionalMap(conn, ((RegionPage)page).getRegion()));
				}
			case REGION_NEWSPAPER:
				if (page instanceof RegionPage) {
					return toList(NewspaperController.getNewspaper(conn, ((RegionPage)page).getRegion()));
				}
			case REGION_UPDATES:
				if (page instanceof RegionPage) {
					return toList(RegionController.getUpdateTime(conn, ((RegionPage)page).getRegionId(), 2));
				}
			case RMB_RATINGS:
				if (request != null) {
					Integer postId = request.getValue("rmb_post_id", null, Integer.class);
					if (postId != null) {
						return toList(RMBController.calculatePostRatings(conn, postId));
					}
				}
				return generateError("invalid post id", request);
			case REGION_POPULATION:
				if (page instanceof RegionPage) {
					return toList(RegionController.getRecordPopulation(conn, ((RegionPage)page).getRegion()));
				}
			case GAMEPLAY_NEWS_SIDEBAR:
				return toList(NewspaperController.getLatestUpdate(conn, NewspaperController.GAMEPLAY_NEWS));
			case ROLEPLAY_NEWS_SIDEBAR:
				return toList(NewspaperController.getLatestUpdate(conn, NewspaperController.ROLEPLAY_NEWS));
			case REGIONAL_NEWS_SIDEBAR:
				return toList(NewspaperController.getLatestUpdate(conn, context.getAccess().getNationLocation().get(context.getNationId())));
			case PENDING_NEWS_SUBMISSIONS:
				Set<Integer> newspapers = NewspaperController.getEditorshipsOfNation(context.getNationId(), conn);
				List<JsonNode> nodes = new ArrayList<JsonNode>(newspapers.size());
				for (Integer newspaper : newspapers) {
					JsonNode n = NewspaperController.getPendingSubmissions(conn, newspaper);
					if (n != null) {
						nodes.add(n);
					}
				}
				return nodes;
			default:
				throw new IllegalStateException("Unimplemented RequestType: " + name());
		}
	}

	private static List<JsonNode> toList(JsonNode n) {
		List<JsonNode> r = new ArrayList<JsonNode>(1);
		r.add(n);
		return r;
	}

	private static List<JsonNode> generateError(String errorMsg, DataRequest request) {
		return toList(Json.toJson("{\"error\":\"" + errorMsg + "\",\"request\":\"" + request.getName() + "\""));
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
