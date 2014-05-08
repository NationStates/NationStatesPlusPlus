package com.afforess.assembly.model.websocket;

import com.afforess.assembly.model.page.NationStatesPage;
import com.afforess.assembly.util.DatabaseAccess;

public class NationContext {
	private final String nation;
	private final int nationId;
	private final NationSettings settings;
	private final NationStatesPage activePage;
	private final DatabaseAccess access;

	public NationContext(String nation, int nationId, NationSettings settings, NationStatesPage page, DatabaseAccess access) {
		this.nation = nation;
		this.nationId = nationId;
		this.settings = settings;
		this.activePage = page;
		this.access = access;
	}

	public String getNation() {
		return nation;
	}

	public int getNationId() {
		return nationId;
	}

	public NationSettings getSettings() {
		return settings;
	}

	public NationStatesPage getActivePage() {
		return activePage;
	}

	public DatabaseAccess getAccess() {
		return access;
	}

}
