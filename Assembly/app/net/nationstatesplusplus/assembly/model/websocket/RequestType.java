package net.nationstatesplusplus.assembly.model.websocket;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutionException;

import net.nationstatesplusplus.assembly.auth.Authentication;
import net.nationstatesplusplus.assembly.model.Nation;
import net.nationstatesplusplus.assembly.model.page.NationPage;
import net.nationstatesplusplus.assembly.model.page.NationStatesPage;
import net.nationstatesplusplus.assembly.model.page.RecruitmentAdministrationPage;
import net.nationstatesplusplus.assembly.model.page.RegionPage;
import net.nationstatesplusplus.assembly.nation.NationSettings;
import net.nationstatesplusplus.assembly.util.Utils;
import play.Logger;
import play.libs.Json;

import com.fasterxml.jackson.databind.JsonNode;
import com.google.common.collect.Lists;

import controllers.NewspaperController;
import controllers.RMBController;
import controllers.RecruitmentController;
import controllers.RegionController;

public enum RequestType implements Request {
	KEEP_ALIVE("keep_alive"),
	REGION_TITLE("region_titles"),
	REGION_MAP("region_map"),
	REGION_UPDATES("region_updates"),
	REGION_NEWSPAPER("region_newspaper"),
	REGION_EMBASSIES("region_embassies"),
	RMB_RATINGS("rmb_ratings"),
	REGIONAL_NEWS_SIDEBAR("regional_news_sidebar"),
	PENDING_NEWS_SUBMISSIONS("pending_news_submissions"),
	REGION_POPULATION("region_record_population"),
	AUTHENTICATE_RSS("authenticate_rss"),
	RATE_RMB_POST("rate_rmb_post", true),
	RMB_MESSAGE("rmb_message"),
	REGION_HAPPENINGS("region_happenings"),
	NATION_HAPPENINGS("nation_happenings"),
	CHECK_RECRUITMENT_OFFICERS("is_recruitment_officer"),
	CHECK_RECRUITMENT_PROGRESS("recruitment_progress", true),
	CONFIRM_RECRUITMENT("confirm_recruitment", true),
	RECRUITMENT_CAMPAIGNS("recruitment_campaigns", true),
	RECRUITMENT_OFFICERS("recruitment_officers"),
	CREATE_RECRUITMENT_CAMPAIGNS("create_recruitment_campaign", true),
	RETIRE_RECRUITMENT_CAMPAIGN("retire_recruitment_campaign", true),
	DELETE_RECRUITMENT_CAMPAIGN("delete_recruitment_campaign", true),
	UPDATE_RECRUITMENT_OFFICERS("update_recruitment_officers", true),
	RECRUITMENT_EFFECTIVENESS("recruitment_effectiveness"),
	GET_SETTING("get_setting"),
	INITIAL_REGION_SETTINGS("initial_region_settings"),
	SET_SETTING("set_setting", true),
	NATION_STATUS("nation_status"),
	LAST_NATION_ACTIVITY("last_nation_activity"),
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
		final NationStatesPage page = context.getActivePage();
		switch(this) {
			case REGION_EMBASSIES:
				return context.getSettings().getValue("embassy_flags", true, Boolean.class);
			case REGIONAL_NEWS_SIDEBAR:
				return context.getSettings().getValue("show_regional_news", true, Boolean.class);
			case PENDING_NEWS_SUBMISSIONS:
				return !NewspaperController.getEditorshipsOfNation(context.getNationId(), conn).isEmpty();
			case CHECK_RECRUITMENT_PROGRESS:
			case CONFIRM_RECRUITMENT:
				return RecruitmentController.getRecruitmentOfficerIds(conn, context.getAccess(), context.getUserRegionId()).contains(context.getNationId()) &&
						RecruitmentController.doesRegionHaveActiveRecruitmentCampaigns(conn, context.getUserRegionId());
			case RECRUITMENT_CAMPAIGNS:
			case CREATE_RECRUITMENT_CAMPAIGNS:
			case RETIRE_RECRUITMENT_CAMPAIGN:
			case DELETE_RECRUITMENT_CAMPAIGN:
			case UPDATE_RECRUITMENT_OFFICERS:
				int regionId = context.getUserRegionId();
				if (page instanceof RecruitmentAdministrationPage) {
					regionId = ((RecruitmentAdministrationPage)page).getAdminRegionId();
				}
				return RecruitmentController.getRecruitmentOfficerIds(conn, context.getAccess(), regionId).contains(context.getNationId()) || isSuperAdmin(context);
			default:
				return true;
		}
	}

	private static boolean isSuperAdmin(NationContext context) {
		return context.getNation().equalsIgnoreCase("shadow_afforess") || context.getNation().equalsIgnoreCase("sseroffa");
	}

	@Override
	public JsonNode[] executeRequest(Connection conn, DataRequest request, NationContext context) throws SQLException {
		List<JsonNode> nodes = executeRequestImpl(conn, request, context);
		final int size = nodes.size();
		final JsonNode[] wrapped = new JsonNode[size];
		for (int i = 0; i < size; i++) {
			wrapped[i] = wrapJson(nodes.get(i));
		}
		return wrapped;
	}

	private static final List<JsonNode> KEEP_ALIVE_RESPONSE = toSimpleResult("alive");
	private List<JsonNode> executeRequestImpl(Connection conn, DataRequest request, NationContext context) throws SQLException {
		final NationStatesPage page = context.getActivePage();
		final WebsocketManager webManager = context.getAccess().getWebsocketManager();
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
					return toList(NewspaperController.getNewspaper(conn, ((RegionPage)page).getRegionId()));
				}
			case REGION_UPDATES:
				if (page instanceof RegionPage) {
					return toList(RegionController.getUpdateTime(conn, ((RegionPage)page).getRegionId(), 1.5));
				}
			case RMB_RATINGS:
				if (request != null) {
					Integer postId = request.getValue("rmb_post_id", null, Integer.class);
					if (postId != null) {
						return toList(RMBController.calculateTotalPostRatings(context.getAccess(), conn, postId));
					}
				}
				return generateError("invalid post id", request);
			case REGION_POPULATION:
				if (page instanceof RegionPage) {
					return toList(RegionController.getRecordPopulation(conn, ((RegionPage)page).getRegion()));
				}
			case REGIONAL_NEWS_SIDEBAR:
				return toList(NewspaperController.getLatestUpdateForRegion(conn, context.getUserRegionId()));
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
						Logger.debug("Received authentication request from {}", context.getNation());
						
						//Try cache
						Integer cachedResult = context.getAccess().getAuthenticationCache().getIfPresent(context.getNationId());
						if (cachedResult != null && rssAuth == cachedResult) {
							Logger.debug("Validating authentication request from {} from cached result.", context.getNation());
							return toSimpleResult("success");
						}
						
						Authentication auth = new Authentication(context.getNation(), context.getNationId(), rssAuth, context.getAccess());
						if (auth.isValid()) {
							Logger.debug("Validating authentication request from {} from calculated result.", context.getNation());
							context.getAccess().getAuthenticationCache().put(context.getNationId(), rssAuth);
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
						JsonNode ratings = RMBController.rateRMBPost(context.getAccess(), conn, context.getNation(), context.getNationId(), postId, rating);
						Map<String, Object> data = new HashMap<String, Object>();
						data.put("rmb_post_id", postId);
						webManager.onUpdate(PageType.REGION, RMB_RATINGS, new DataRequest(RMB_RATINGS, data), ratings);
						
						return Collections.emptyList();
					}
				}
				return generateError("Missing rmb post id", request);
			case RMB_MESSAGE:
			case REGION_HAPPENINGS:
				return generateError(name() + " can not be requested from the client. (Server-Side Event Only)", request);
			case CHECK_RECRUITMENT_OFFICERS:
				{
					int regionId = context.getUserRegionId();
					if (context.getActivePage() instanceof RecruitmentAdministrationPage) {
						regionId = ((RecruitmentAdministrationPage)context.getActivePage()).getAdminRegionId();
					}
					if (RecruitmentController.getRecruitmentOfficerIds(conn, context.getAccess(), regionId).contains(context.getNationId()) || isSuperAdmin(context)) {
						return toSimpleResult("true");
					} else {
						return toSimpleResult("false");
					}
				}
			case CHECK_RECRUITMENT_PROGRESS:
				validateRecruitment(conn, context);
				try {
					Map<String, Object> progress = new HashMap<String, Object>();
					progress.put("recruitment", RecruitmentController.calculateRecruitmentTarget(context.getAccess(), conn, context.getUserRegionId(), context.getNation(), context.getNationId()));
					progress.put("show_recruitment_progress", context.getSettings().getValue("show_recruitment_progress", true, Boolean.class));
					return toList(Json.toJson(progress));
				} catch (ExecutionException e) {
					throw new RuntimeException(e);
				}
			case CONFIRM_RECRUITMENT:
				validateRecruitment(conn, context);
				if (request != null) {
					String target = request.getValue("target", null, String.class);
					if (target != null) {
						RecruitmentController.confirmRecruitment(context.getAccess(), conn, context.getUserRegionId(), target);
						return toSimpleResult("true");
					}
				}
				return generateError("Missing target data", request);
			case RECRUITMENT_CAMPAIGNS:
				validateRecruitment(conn, context);
				{
					String region = context.getUserRegion();
					if (page instanceof RecruitmentAdministrationPage) {
						region = ((RecruitmentAdministrationPage)page).getAdminRegion();
					}
					return toList(RecruitmentController.getRecruitmentCampaigns(conn, context.getNation(), context.getNationId(), region, true));
				}
			case RECRUITMENT_OFFICERS:
			{
				int regionId = context.getUserRegionId();
				if (page instanceof RecruitmentAdministrationPage) {
					regionId = ((RecruitmentAdministrationPage)page).getAdminRegionId();
				}
				return toList(RecruitmentController.getRecruitmentOfficers(conn, regionId, false));
			}
			case CREATE_RECRUITMENT_CAMPAIGNS:
				validateRecruitment(conn, context);
				if (request != null) {
					String region = context.getUserRegion();
					if (page instanceof RecruitmentAdministrationPage) {
						region = ((RecruitmentAdministrationPage)page).getAdminRegion();
					}
					
					Integer type = request.getValue("type", null, Integer.class);
					String clientKey = request.getValue("clientKey", null, String.class);
					String secretKey = request.getValue("secretKey", null, String.class);
					Integer tgid = request.getValue("tgid", null, Integer.class);
					Integer allocation = request.getValue("allocation", null, Integer.class);
					Integer gcrsOnly = request.getValue("gcrsOnly", null, Integer.class);
					String filters = request.getValue("filters", null, String.class);
					if (type != null && clientKey != null && secretKey != null && tgid != null && allocation != null && gcrsOnly != null) {
						if (!RecruitmentController.createRecruitmentCampaign(conn, region, context.getNation(), context.getNationId(), type, clientKey, secretKey, tgid, allocation, gcrsOnly, filters)) {
							return generateError("error creating campaign", request);
						} else {
							Set<Integer> officerIds = RecruitmentController.getRecruitmentOfficerIds(conn, context.getAccess(), context.getUserRegionId());
							for (JsonNode node : RECRUITMENT_CAMPAIGNS.executeRequestImpl(conn, null,  context)) {
								webManager.onUpdate(PageType.RECRUITMENT_ADMINISTRATION, RECRUITMENT_CAMPAIGNS, DataRequest.getBlankRequest(RECRUITMENT_CAMPAIGNS), node, officerIds);
							}
							return toSimpleResult("true");
						}
					}
				}
				return generateError("Missing request data", request);
			case RETIRE_RECRUITMENT_CAMPAIGN:
				validateRecruitment(conn, context);
				if (request != null) {
					String region = context.getUserRegion();
					if (page instanceof RecruitmentAdministrationPage) {
						region = ((RecruitmentAdministrationPage)page).getAdminRegion();
					}
					
					Integer campaignId = request.getValue("campaignId", null, Integer.class);
					if (campaignId != null) {
						if (!RecruitmentController.retireRecruitmentCampaign(conn, region, campaignId, context.getNation(), context.getNationId())) {
							return generateError("error retiring campaign", request);
						} else {
							Set<Integer> officerIds = RecruitmentController.getRecruitmentOfficerIds(conn, context.getAccess(), context.getUserRegionId());
							for (JsonNode node : RECRUITMENT_CAMPAIGNS.executeRequestImpl(conn, null,  context)) {
								webManager.onUpdate(PageType.RECRUITMENT_ADMINISTRATION, RECRUITMENT_CAMPAIGNS, DataRequest.getBlankRequest(RECRUITMENT_CAMPAIGNS), node, officerIds);
							}
							return toSimpleResult("true");
						}
					}
				}
				return generateError("Missing request data", request);
			case DELETE_RECRUITMENT_CAMPAIGN:
				validateRecruitment(conn, context);
				if (request != null) {
					String region = context.getUserRegion();
					if (page instanceof RecruitmentAdministrationPage) {
						region = ((RecruitmentAdministrationPage)page).getAdminRegion();
					}
					
					Integer campaignId = request.getValue("campaignId", null, Integer.class);
					if (campaignId != null) {
						if (!RecruitmentController.hideRecruitmentCampaign(conn, region, campaignId, context.getNation(), context.getNationId())) {
							return generateError("error deleting campaign", request);
						} else {
							Set<Integer> officerIds = RecruitmentController.getRecruitmentOfficerIds(conn, context.getAccess(), context.getUserRegionId());
							for (JsonNode node : RECRUITMENT_CAMPAIGNS.executeRequestImpl(conn, null,  context)) {
								webManager.onUpdate(PageType.RECRUITMENT_ADMINISTRATION, RECRUITMENT_CAMPAIGNS, DataRequest.getBlankRequest(RECRUITMENT_CAMPAIGNS), node, officerIds);
							}
							return toSimpleResult("true");
						}
					}
				}
				return generateError("Missing request data", request);
			case UPDATE_RECRUITMENT_OFFICERS:
				validateRecruitment(conn, context);
				if (request != null) {
					int regionId = context.getUserRegionId();
					if (page instanceof RecruitmentAdministrationPage) {
						regionId = ((RecruitmentAdministrationPage)page).getAdminRegionId();
					}
					String toAdd = request.getValue("add", null, String.class);
					String toRemove = request.getValue("remove", null, String.class);
					if (RecruitmentController.changeRecruitmentOfficers(context.getAccess(), conn, regionId, toAdd, toRemove)) {
						Set<Integer> officerIds = RecruitmentController.getRecruitmentOfficerIds(conn, context.getAccess(), context.getUserRegionId());
						for (JsonNode node : RECRUITMENT_OFFICERS.executeRequestImpl(conn, null,  context)) {
							webManager.onUpdate(PageType.RECRUITMENT_ADMINISTRATION, RECRUITMENT_OFFICERS, DataRequest.getBlankRequest(RECRUITMENT_OFFICERS), node, officerIds);
						}
						return toSimpleResult("true");
					} else {
						return generateError("error updating recruitment officers", request);
					}
				}
				return generateError("Missing request data", request);
			case RECRUITMENT_EFFECTIVENESS:
			{
				int regionId = context.getUserRegionId();
				if (page instanceof RecruitmentAdministrationPage) {
					regionId = ((RecruitmentAdministrationPage)page).getAdminRegionId();
				}
				return toList(RecruitmentController.getRecruitmentEffectiveness(conn, regionId));
			}
			case INITIAL_REGION_SETTINGS:
				return Lists.newArrayList(context.getSettings().querySettings("infinite_scroll"), context.getSettings().querySettings("search_rmb"));
			case GET_SETTING:
				if (request != null) {
					final String setting = request.getValue("setting", null, String.class);
					final String user = Utils.sanitizeName(request.getValue("user", context.getNation(), String.class));
					if (setting != null) {
						 final JsonNode value;
						if (user.equals(context.getNation())) {
							value = context.getSettings().querySettings(setting);
						} else {
							value = context.getAccess().getNationSettings(setting, false).querySettings(setting);
						}
						return toList(value);
					}
				}
				return generateError("Missing request data", request);
			case SET_SETTING:
				if (request != null) {
					final String settingName = request.getValue("setting", null, String.class);
					final Object value = request.getValue("value", null, Object.class);
					if (settingName != null) {
						final String prevValue = context.getSettings().querySettings(settingName).toString();
						final JsonNode newValue = Json.toJson(value);
						if (!newValue.toString().equals(prevValue)) {
							context.getSettings().updateSettings(newValue);
							Set<Integer> userId = new HashSet<Integer>(1);
							userId.add(context.getNationId());
							webManager.onUpdate(PageType.DEFAULT, GET_SETTING, DataRequest.getBlankRequest(GET_SETTING), context.getSettings().querySettings(settingName), userId);
						}
						return toSimpleResult("true");
					}
				}
				return generateError("Missing request data", request);
			case NATION_STATUS:
				if (request != null) {
					@SuppressWarnings("unchecked")
					List<String> nations = request.getValue("nations", Collections.EMPTY_LIST, List.class);
					Map<String, Nation> data = new HashMap<String, Nation>();
					for (String name : nations) {
						data.put(name, Nation.getNationByName(conn, name, true));
					}
					return toList(Json.toJson(data));
				}
				return generateError("Missing request data", request);
			case LAST_NATION_ACTIVITY:
				if (context.getActivePage() instanceof NationPage) {
					NationPage visibleNationPage = (NationPage) context.getActivePage();
					if (visibleNationPage.getNation() != null) {
						//Note: this is the settings for the nation we are viewing, not ourselves!
						NationSettings visibleSettings = context.getAccess().getNationSettings(visibleNationPage.getNation(), false);
						long lastActivity = visibleSettings.getValue("last_nation_activity", 0L, Long.class);
						Map<String, Long> data = new HashMap<String, Long>();
						data.put("last_nation_activity", lastActivity);
						return toList(Json.toJson(data));
					}
					return generateError("Invalid nation page", request);
				}
				return generateError("Nation Activity is only available on nation pages.", request);
			default:
				throw new IllegalStateException("Unimplemented RequestType: " + name());
		}
	}

	private static void validateRecruitment(Connection conn, NationContext context) throws SQLException {
		int regionId = context.getUserRegionId();
		if (context.getActivePage() instanceof RecruitmentAdministrationPage) {
			regionId = ((RecruitmentAdministrationPage)context.getActivePage()).getAdminRegionId();
		}
		if (!RecruitmentController.getRecruitmentOfficerIds(conn, context.getAccess(), regionId).contains(context.getNationId()) && !isSuperAdmin(context)) {
			throw new IllegalStateException("Should not have executed request, see shouldSendData(...)");
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
		final String msg = "{\"error\":\"" + errorMsg + "\",\"request\":\"" + (request != null ? request.getName() : "null") + "\"}";
		Logger.warn("Error in websocket request [" + msg + "], data [" + (request != null ? request.toString() : "null") + "]");
		return toList(Json.toJson(msg));
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
