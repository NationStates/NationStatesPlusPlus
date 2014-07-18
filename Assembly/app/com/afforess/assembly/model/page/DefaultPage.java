package com.afforess.assembly.model.page;

import com.afforess.assembly.model.websocket.DataRequest;
import com.afforess.assembly.model.websocket.PageType;
import com.afforess.assembly.model.websocket.RequestType;

public class DefaultPage extends NationStatesPage {
	public DefaultPage() {
		super(PageType.DEFAULT);
	}

	@Override
	public void onRequest(RequestType type, DataRequest request) {
	}
}
