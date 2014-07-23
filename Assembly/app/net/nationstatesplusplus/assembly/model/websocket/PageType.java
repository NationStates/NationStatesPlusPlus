package net.nationstatesplusplus.assembly.model.websocket;

import static net.nationstatesplusplus.assembly.model.websocket.RequestType.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public enum PageType {
	DEFAULT(GAMEPLAY_NEWS_SIDEBAR, ROLEPLAY_NEWS_SIDEBAR, REGIONAL_NEWS_SIDEBAR, PENDING_NEWS_SUBMISSIONS, CHECK_RECRUITMENT_OFFICERS),
	REGION(INITIAL_REGION_SETTINGS, REGION_TITLE, REGION_MAP, REGION_UPDATES, REGION_NEWSPAPER, REGION_EMBASSIES, REGION_POPULATION),
	NATION,
	WA,
	RECRUITMENT_ADMINISTRATION(RECRUITMENT_CAMPAIGNS, RECRUITMENT_OFFICERS, RECRUITMENT_EFFECTIVENESS),
	
	;

	private final List<RequestType> initialRequests;
	PageType(RequestType... initial) {
		if (initial != null) initialRequests = Arrays.asList(initial);
		else initialRequests = Collections.emptyList();
	}

	public List<RequestType> getInitialRequests() {
		if (this == DEFAULT) {
			return new ArrayList<RequestType>(initialRequests);
		}
		List<RequestType> initial = new ArrayList<RequestType>(initialRequests);
		initial.addAll(DEFAULT.initialRequests);
		return initial;
	}
}
