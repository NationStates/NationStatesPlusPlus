package net.nationstatesplusplus.assembly.model.page;

import net.nationstatesplusplus.assembly.model.websocket.DataRequest;
import net.nationstatesplusplus.assembly.model.websocket.PageType;
import net.nationstatesplusplus.assembly.model.websocket.RequestType;

public class DefaultPage extends NationStatesPage {
	public DefaultPage() {
		super(PageType.DEFAULT);
	}

	@Override
	public void onRequest(RequestType type, DataRequest request) {
	}
}
