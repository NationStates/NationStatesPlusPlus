package com.afforess.assembly.model.websocket;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class DataRequest {
	@JsonProperty
	private String name;
	@JsonProperty()
	private Map<String, Object> data;

	public DataRequest() {
		data = new HashMap<String, Object>();
	}

	public DataRequest(String name) {
		this.name = name;
		data = new HashMap<String, Object>();
	}

	public DataRequest(RequestType type, Map<String, Object> data) {
		this.name = type.getType();
		this.data = data;
	}

	public String getName() {
		return name;
	}

	public <V> V getValue(String name, V defaultVal, Class<V> type) {
		if (data.containsKey(name)) {
			if (Number.class.isAssignableFrom(type)) {
				Object val = data.get(name);
				if (val instanceof String) {
					if (Integer.class == type) {
						return type.cast(Integer.valueOf(Integer.parseInt((String)val)));
					} else if (Double.class == type) {
						return type.cast(Double.valueOf(Double.parseDouble((String)val)));
					}
				}
			}
			return type.cast(data.get(name));
		}
		return defaultVal;
	}

	public static DataRequest parse(JsonNode n) {
		ObjectMapper mapper = new ObjectMapper();
		try {
			return mapper.readValue(n.toString(), DataRequest.class);
		} catch (Exception e) {
			throw new RuntimeException("Unable to parse nation settings", e);
		}
	}

	public static DataRequest getBlankRequest(RequestType type) {
		return new DataRequest(type, Collections.<String, Object> emptyMap());
	}
}
