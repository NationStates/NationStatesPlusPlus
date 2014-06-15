package com.afforess.assembly.model.page;

import com.afforess.assembly.model.websocket.DataRequest;
import com.afforess.assembly.model.websocket.PageType;
import com.afforess.assembly.model.websocket.RequestType;

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
