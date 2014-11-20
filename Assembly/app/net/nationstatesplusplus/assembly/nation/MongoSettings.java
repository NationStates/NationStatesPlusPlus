package net.nationstatesplusplus.assembly.nation;

import java.util.Collections;
import java.util.Map;

import play.libs.Json;

import com.fasterxml.jackson.databind.JsonNode;
import com.mongodb.BasicDBObject;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;
import com.mongodb.util.JSON;

public class MongoSettings implements NationSettings {
	private final DBCollection users;
	private final String nation;
	public MongoSettings(DBCollection users, String nation) {
		this.users = users;
		this.nation = nation;

	}

	@Override
	public <V> V getValue(String name, V defaultVal, Class<V> type) {
		V value = getValueImpl(name, defaultVal, type);
		if (value == null) {
			return defaultVal;
		}
		return value;
	}

	@SuppressWarnings("unchecked")
	private <V> V getValueImpl(String name, V defaultVal, Class<V> type) {
		BasicDBObject find = new BasicDBObject("nation", nation);
		BasicDBObject query = new BasicDBObject(name, 1);
		try (DBCursor cursor = this.users.find(find, query)) {
			if (cursor.hasNext()) {
				DBObject result = cursor.next();
				Object obj = result.get(name);
				//Auto-magically convert any strings to numbers, if we requested a number type
				if (obj instanceof String && Number.class.isAssignableFrom(type)) {
					try {
						double val = Double.parseDouble((String)obj);
						if (type == Double.class) {
							return (V) Double.valueOf(val);
						} else if (type == Float.class) {
							return (V) Float.valueOf((float)val);
						} else if (type == Integer.class) {
							return (V) Integer.valueOf((int)val);
						} else if (type == Long.class) {
							return (V) Long.valueOf((long)val);
						}
					} catch (NumberFormatException e) {
						return defaultVal;
					}
				} else if (obj instanceof String && Boolean.class.isAssignableFrom(type)) {
					return (V) Boolean.valueOf("true".equalsIgnoreCase((String)obj));
				}
				return type.cast(obj);
			}
		}
		return defaultVal;
	}

	@SuppressWarnings("unchecked")
	@Override
	public JsonNode querySettings(String name) {
		BasicDBObject find = new BasicDBObject("nation", nation);
		BasicDBObject query = new BasicDBObject(name, 1);
		Map<Object, Object> json = Collections.emptyMap();
		try (DBCursor cursor = this.users.find(find, query)) {
			if (cursor.hasNext()) {
				DBObject result = cursor.next();
				json = result.toMap();
			}
		}
		if (!json.containsKey(name)) {
			json.put(name, null);
		}
		return Json.toJson(json);
	}

	@Override
	public void updateSettings(JsonNode value) {
		BasicDBObject find = new BasicDBObject("nation", nation);
		DBObject obj = (DBObject)JSON.parse(value.toString());
		BasicDBObject update = new BasicDBObject("$set", obj);
		this.users.update(find, update);
	}

	public DBCollection getCollection() {
		return users;
	}
}
