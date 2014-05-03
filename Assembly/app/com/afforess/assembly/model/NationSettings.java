package com.afforess.assembly.model;

import java.util.HashMap;
import java.util.Map;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

public class NationSettings {
	private Map<String, Object> settings = new HashMap<String, Object>();

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
			Map<String, Object> data = mapper.readValue(settings, new TypeReference<HashMap<String,Object>>() {});
			NationSettings parsed = new NationSettings();
			parsed.settings = data;
			return parsed;
		} catch (Exception e) {
			throw new RuntimeException("Unable to parse nation settings", e);
		}
	}

}
