package controllers;

import com.afforess.assembly.util.NationCache;
import com.afforess.assembly.util.RegionCache;
import com.limewoodMedia.nsapi.NationStates;
import com.mchange.v2.c3p0.ComboPooledDataSource;

public abstract class NationStatesController extends DatabaseController{
	private final NationStates api;
	public NationStatesController(ComboPooledDataSource pool, NationCache cache, RegionCache regionCache, NationStates api) {
		super(pool, cache, regionCache);
		this.api = api;
	}

	public final NationStates getAPI() {
		return api;
	}
}
