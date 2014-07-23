package net.nationstatesplusplus.assembly.nation;

import com.fasterxml.jackson.databind.JsonNode;

public class DefaultSettings implements NationSettings {
	@Override
	public <V> V getValue(String name, V defaultVal, Class<V> type) {
		return defaultVal;
	}

	@Override
	public JsonNode querySettings(String query) {
		return null;
	}

	@Override
	public void updateSettings(String name, JsonNode update) {
		
	}
}
