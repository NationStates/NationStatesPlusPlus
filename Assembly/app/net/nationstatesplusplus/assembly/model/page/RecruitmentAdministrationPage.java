package net.nationstatesplusplus.assembly.model.page;

import net.nationstatesplusplus.assembly.model.websocket.DataRequest;
import net.nationstatesplusplus.assembly.model.websocket.PageType;
import net.nationstatesplusplus.assembly.model.websocket.RequestType;

public class RecruitmentAdministrationPage extends NationStatesPage {
	private final String adminRegion;
	private final int adminRegionId;
	public RecruitmentAdministrationPage(String adminRegion, int adminRegionId) {
		super(PageType.RECRUITMENT_ADMINISTRATION);
		this.adminRegion = adminRegion;
		this.adminRegionId = adminRegionId;
	}

	@Override
	public void onRequest(RequestType type, DataRequest request) {
	}

	public String getAdminRegion() {
		return adminRegion;
	}

	public int getAdminRegionId() {
		return adminRegionId;
	}
}
