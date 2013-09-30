package controllers;

import org.spout.cereal.config.yaml.YamlConfiguration;

import com.afforess.assembly.util.DatabaseAccess;
import com.limewoodMedia.nsapi.NationStates;

public abstract class NationStatesController extends DatabaseController{
	private final NationStates api;
	public NationStatesController(DatabaseAccess access, YamlConfiguration config, NationStates api) {
		super(access, config);
		this.api = api;
	}

	public final NationStates getAPI() {
		return api;
	}
}
