package com.afforess.assembly.model;

import java.util.HashMap;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class NationSettings {
	@JsonProperty("settings")
	private Map<String, Object> settings = new HashMap<String, Object>();

	@JsonProperty("last_update")
	private long lastUpdate = 0L;

	public NationSettings() {
		
	}

	public <V> V getValue(String name, V defaultVal, Class<V> type) {
		if (settings.containsKey(name)) {
			return type.cast(settings.get(name));
		}
		return defaultVal;
	}

	public long getLastUpdate() {
		return lastUpdate;
	}

	public void setLastUpdate(long time) {
		lastUpdate = time;
	}

	public static NationSettings parse(String settings) {
		ObjectMapper mapper = new ObjectMapper();
		try {
			return mapper.readValue(settings, NationSettings.class);
		} catch (Exception e) {
			throw new RuntimeException("Unable to parse nation settings", e);
		}
	}
}
