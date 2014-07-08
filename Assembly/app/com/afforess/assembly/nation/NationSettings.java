package com.afforess.assembly.nation;

import com.fasterxml.jackson.databind.JsonNode;

public interface NationSettings {

	public <V> V getValue(String name, V defaultVal, Class<V> type);

	public JsonNode querySettings(String query);

	public void updateSettings(String name, JsonNode update);
}
