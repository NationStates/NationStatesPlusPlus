package com.afforess.assembly.model.websocket;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutionException;

import play.libs.Json;

import com.afforess.assembly.auth.Authentication;
import com.afforess.assembly.model.page.NationStatesPage;
import com.afforess.assembly.model.page.RegionPage;
import com.fasterxml.jackson.databind.JsonNode;

import controllers.NewspaperController;
import controllers.RMBController;
import controllers.RecruitmentController;
import controllers.RegionController;

public enum RequestType {
	KEEP_ALIVE("keep_alive"),
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
	REGION_POPULATION("region_record_population"),
	AUTHENTICATE_RSS("authenticate_rss"),
	RATE_RMB_POST("rate_rmb_post", true),
	RMB_MESSAGE("rmb_message"),
	REGION_HAPPENINGS("region_happenings"),
	NATION_HAPPENINGS("nation_happenings"),
	CHECK_RECRUITMENT_OFFICERS("recruitment_officers"),
	CHECK_RECRUITMENT_PROGRESS("recruitment_progress", true),
	CONFIRM_RECRUITMENT("confirm_recruitment", true),
	;

	private static final Map<String, RequestType> types = new HashMap<String, RequestType>();
	private final String name;
	private final boolean requiresAuth;
	RequestType(String name) {
		this(name, false);
	}

	RequestType(String name, boolean requiresAuth) {
		this.name = name;
		this.requiresAuth = requiresAuth;
	}

	public String getType() {
		return name;
	}

	public boolean requiresAuthentication() {
		return requiresAuth;
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
			case CHECK_RECRUITMENT_OFFICERS:
			case CHECK_RECRUITMENT_PROGRESS:
			case CONFIRM_RECRUITMENT:
				return RecruitmentController.getRecruitmentOfficerIds(conn, context.getAccess(), context.getUserRegionId()).contains(context.getNationId()) &&
						RecruitmentController.doesRegionHaveActiveRecruitmentCampaigns(conn, context.getUserRegionId());
			default:
				return true;
		}
	}

	public List<JsonNode> executeRequest(Connection conn, DataRequest request, NationContext context) throws SQLException {
		List<JsonNode> nodes = executeRequestImpl(conn, request, context);
		final int size = nodes.size();
		for (int i = 0; i < size; i++) {
			nodes.set(i, wrapJson(nodes.get(i)));
		}
		return nodes;
	}

	private static final List<JsonNode> KEEP_ALIVE_RESPONSE = toSimpleResult("alive");
	private List<JsonNode> executeRequestImpl(Connection conn, DataRequest request, NationContext context) throws SQLException {
		final NationStatesPage page = context.getActivePage();
		switch(this) {
			case KEEP_ALIVE:
				return KEEP_ALIVE_RESPONSE;
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
						return toList(RMBController.calculateTotalPostRatings(conn, postId));
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
				return toList(NewspaperController.getLatestUpdate(conn, context.getUserRegion()));
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
			case AUTHENTICATE_RSS:
				if (request != null) {
					String rssKey = request.getValue("rss-key", null, String.class);
					if (rssKey != null) {
						int rssAuth;
						try {
							rssAuth = Integer.parseInt(rssKey);
						} catch (NumberFormatException e) {
							return generateError("invalid rss key, must be numeric", request);
						}
						Authentication auth = new Authentication(context.getNation(), context.getNationId(), rssAuth, context.getAccess());
						if (auth.isValid()) {
							return toSimpleResult("success");
						} else {
							return toSimpleResult(auth.getFailureReason());
						}
					}
				}
				return generateError("Missing authentication code", request);
			case RATE_RMB_POST:
				if (request != null) {
					Integer postId = request.getValue("rmb_post_id", null, Integer.class);
					Integer rating = request.getValue("rating", null, Integer.class);
					if (postId != null && rating != null) {
						JsonNode ratings = RMBController.rateRMBPost(conn, context.getNation(), context.getNationId(), postId, rating);
						Map<String, Object> data = new HashMap<String, Object>();
						data.put("rmb_post_id", postId);
						context.getAccess().getWebsocketManager().onUpdate(PageType.REGION, RequestType.RMB_RATINGS, new DataRequest(RequestType.RMB_RATINGS, data), ratings);
						
						return Collections.emptyList();
					}
				}
				return generateError("Missing rmb post id", request);
			case RMB_MESSAGE:
			case REGION_HAPPENINGS:
				return generateError(name() + " can not be requested from the client. (Server-Side Event Only)", request);
			case CHECK_RECRUITMENT_OFFICERS:
				{
					boolean valid = RecruitmentController.getRecruitmentOfficerIds(conn, context.getAccess(), context.getUserRegionId()).contains(context.getNationId()) &&
									RecruitmentController.doesRegionHaveActiveRecruitmentCampaigns(conn, context.getUserRegionId());
					if (!valid) {
						throw new IllegalStateException("Should not have executed request, see shouldSendData(...)");
					}
					return toSimpleResult("true");
				}
			case CHECK_RECRUITMENT_PROGRESS:
				{
					boolean valid = RecruitmentController.getRecruitmentOfficerIds(conn, context.getAccess(), context.getUserRegionId()).contains(context.getNationId()) &&
									RecruitmentController.doesRegionHaveActiveRecruitmentCampaigns(conn, context.getUserRegionId());
					if (!valid) {
						throw new IllegalStateException("Should not have executed request, see shouldSendData(...)");
					}
					try {
						Map<String, Object> progress = new HashMap<String, Object>();
						progress.put("recruitment", RecruitmentController.calculateRecruitmentTarget(context.getAccess(), conn, context.getUserRegionId(), context.getNation()));
						progress.put("show_recruitment_progress", context.getSettings().getValue("show_recruitment_progress", true, Boolean.class));
						return toList(Json.toJson(progress));
					} catch (ExecutionException e) {
						throw new RuntimeException(e);
					}
				}
			case CONFIRM_RECRUITMENT:
			{
				boolean valid = RecruitmentController.getRecruitmentOfficerIds(conn, context.getAccess(), context.getUserRegionId()).contains(context.getNationId()) &&
								RecruitmentController.doesRegionHaveActiveRecruitmentCampaigns(conn, context.getUserRegionId());
				if (!valid) {
					throw new IllegalStateException("Should not have executed request, see shouldSendData(...)");
				}
				if (request != null) {
					String target = request.getValue("target", null, String.class);
					if (target != null) {
						RecruitmentController.confirmRecruitment(context.getAccess(), conn, context.getUserRegionId(), target);
						return toSimpleResult("true");
					}
				}
				return generateError("Missing target data", request);
			}
			default:
				throw new IllegalStateException("Unimplemented RequestType: " + name());
		}
	}

	private static List<JsonNode> toList(JsonNode n) {
		List<JsonNode> r = new ArrayList<JsonNode>(1);
		r.add(n);
		return r;
	}

	private static List<JsonNode> toSimpleResult(String msg){
		HashMap<String, String> result = new HashMap<String, String>(1);
		result.put("result", msg);
		return toList(Json.toJson(result));
	}

	private static List<JsonNode> generateError(String errorMsg, DataRequest request) {
		return toList(Json.toJson("{\"error\":\"" + errorMsg + "\",\"request\":\"" + request.getName() + "\"}"));
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
