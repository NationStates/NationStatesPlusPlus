package com.afforess.assembly.model.page;

import com.afforess.assembly.model.websocket.DataRequest;
import com.afforess.assembly.model.websocket.PageType;
import com.afforess.assembly.model.websocket.RequestType;

public abstract class NationStatesPage {
	private final PageType type;
	public NationStatesPage(PageType type) {
		this.type = type;
	}

	public final PageType getType() {
		return type;
	}

	public boolean isValidUpdate(RequestType type, DataRequest request) {
		for (RequestType t : this.type.getInitialRequests()) {
			if (t == type)
				return true;
		}
		return type == RequestType.KEEP_ALIVE;
	}

	public abstract void onRequest(RequestType type, DataRequest request);
}
