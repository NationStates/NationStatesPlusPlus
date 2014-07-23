package net.nationstatesplusplus.assembly.model.page;

import net.nationstatesplusplus.assembly.model.websocket.DataRequest;
import net.nationstatesplusplus.assembly.model.websocket.PageType;
import net.nationstatesplusplus.assembly.model.websocket.RequestType;

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
		return type == RequestType.KEEP_ALIVE || type == RequestType.GET_SETTING;
	}

	public abstract void onRequest(RequestType type, DataRequest request);
}
