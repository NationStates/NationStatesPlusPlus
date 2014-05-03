package com.afforess.assembly.model;

public enum PageType {
	REGION(RequestType.REGION_TITLE, RequestType.REGION_MAP, RequestType.REGION_UPDATES, RequestType.REGION_NEWSPAPER, RequestType.REGION_EMBASSIES),
	NATION,
	WA,
	
	;

	private final RequestType[] initialRequests;
	PageType(RequestType... initial) {
		if (initial != null) initialRequests = initial;
		else initialRequests = new RequestType[0];
	}

	public RequestType[] getInitialRequests() {
		return initialRequests;
	}
}
