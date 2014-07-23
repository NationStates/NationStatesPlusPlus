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
		BasicDBObject find = new BasicDBObject("nation", nation);
		BasicDBObject query = new BasicDBObject(name, 1);
		try (DBCursor cursor = this.users.find(find, query)) {
			if (cursor.hasNext()) {
				DBObject result = cursor.next();
				Object obj = result.get(name);
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
	public void updateSettings(String name, JsonNode value) {
		BasicDBObject find = new BasicDBObject("nation", nation);
		DBObject obj = (DBObject)JSON.parse(value.toString());
		BasicDBObject update = new BasicDBObject("$set", obj);
		this.users.update(find, update);
	}
}
