package com.afforess.assembly.model.websocket;

import static com.afforess.assembly.model.websocket.RequestType.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public enum PageType {
	DEFAULT(GAMEPLAY_NEWS_SIDEBAR, ROLEPLAY_NEWS_SIDEBAR, REGIONAL_NEWS_SIDEBAR),
	REGION(REGION_TITLE, REGION_MAP, REGION_UPDATES, REGION_NEWSPAPER, REGION_EMBASSIES),
	NATION,
	WA,
	
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
