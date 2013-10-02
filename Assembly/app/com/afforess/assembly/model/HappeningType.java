package com.afforess.assembly.model;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Pattern;

public class HappeningType {
	private static final Map<Integer, HappeningType> types = new LinkedHashMap<Integer, HappeningType>();
	private static final Map<String, HappeningType> categories = new HashMap<String, HappeningType>();
	private final int id;
	private final Pattern match;
	private final String name;
	private HappeningType(final int id, final String match, final String name) {
		this.id = id;
		this.match = Pattern.compile(match);
		this.name = name;
	}

	public static void initialize(Connection conn) throws SQLException {
		PreparedStatement select = conn.prepareStatement("SELECT id, regex, name FROM assembly.happening_type ORDER BY id ASC");
		ResultSet result = select.executeQuery();
		while(result.next()) {
			HappeningType type = new HappeningType(result.getInt(1), result.getString(2), result.getString(3));
			types.put(type.id, type);
			categories.put(type.name, type);
		}
	}

	public int getId() {
		return id;
	}

	public String getName() {
		return name;
	}

	public static HappeningType getType(int id) {
		return types.get(id);
	}

	public static HappeningType getType(String name) {
		return categories.get(name);
	}

	public static int match(String happening) {
		happening = happening.toLowerCase();
		for (HappeningType type : types.values()) {
			if (type.match.matcher(happening).find()) {
				return type.id;
			}
		}
		return -1;
	}
}