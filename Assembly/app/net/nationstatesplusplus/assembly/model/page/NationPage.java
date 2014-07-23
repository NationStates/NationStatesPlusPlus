package net.nationstatesplusplus.assembly.model.page;

import net.nationstatesplusplus.assembly.model.websocket.DataRequest;
import net.nationstatesplusplus.assembly.model.websocket.PageType;
import net.nationstatesplusplus.assembly.model.websocket.RequestType;

public class NationPage extends NationStatesPage {
	private final String nation;
	private final int nationId;
	public NationPage(String nation, int nationId) {
		super(PageType.NATION);
		this.nation = nation;
		this.nationId = nationId;
	}

	public String getNation() {
		return nation;
	}

	public int getNationId() {
		return nationId;
	}

	@Override
	public boolean isValidUpdate(RequestType type, DataRequest request) {
		if (type == RequestType.NATION_HAPPENINGS) {
			return nationId == request.getValue("nation", null, Integer.class);
		}
		return super.isValidUpdate(type, request);
	}

	@Override
	public void onRequest(RequestType type, DataRequest request) {
	}
}
