package controllers;

import com.afforess.assembly.util.DatabaseAccess;
import com.limewoodMedia.nsapi.NationStates;

public abstract class NationStatesController extends DatabaseController{
	private final NationStates api;
	public NationStatesController(DatabaseAccess access, NationStates api) {
		super(access);
		this.api = api;
	}

	public final NationStates getAPI() {
		return api;
	}
}
