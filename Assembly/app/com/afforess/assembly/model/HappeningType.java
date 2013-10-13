package com.afforess.assembly.model;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.afforess.assembly.util.Utils;

public class HappeningType {
	private static final Map<Integer, HappeningType> types = new LinkedHashMap<Integer, HappeningType>();
	private static final Map<String, HappeningType> categories = new HashMap<String, HappeningType>();
	private final int id;
	private final Pattern match;
	private final String name;
	private final String region1Transform;
	private final String region2Transform;
	private final List<Pattern> region1Regex = new ArrayList<Pattern>(1);
	private final List<Pattern> region2Regex = new ArrayList<Pattern>(1);
	private HappeningType(final int id, final String match, final String name, final String region1Transform, final String region2Transform) {
		this.id = id;
		this.match = Pattern.compile(match);
		this.name = name;
		this.region1Transform = region1Transform;
		this.region2Transform = region2Transform;
		if (region1Transform != null) {
			Matcher regexMatch = RAW_REGEX.matcher(region1Transform);
			while(regexMatch.find()) {
				String regex = region1Transform.substring(regexMatch.start() + 2, regexMatch.end() - 2);
				region1Regex.add(Pattern.compile(regex));
			}
		}
		if (region2Transform != null) {
			Matcher regexMatch = RAW_REGEX.matcher(region2Transform);
			while(regexMatch.find()) {
				String regex = region2Transform.substring(regexMatch.start() + 2, regexMatch.end() - 2);
				region2Regex.add(Pattern.compile(regex));
			}
		}
	}

	public static void initialize(Connection conn) throws SQLException {
		PreparedStatement select = conn.prepareStatement("SELECT id, regex, name, region_1_happening, region_2_happening FROM assembly.happening_type ORDER BY id ASC");
		ResultSet result = select.executeQuery();
		while(result.next()) {
			HappeningType type = new HappeningType(result.getInt(1), result.getString(2), result.getString(3), result.getString(4), result.getString(5));
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

	private static final Pattern RAW_REGEX = Pattern.compile("!![^\\s]*!!");
	private String transformToRegionHappening(int regionNum, String happening) {
		final String regionTransform = (regionNum == 1 ? region1Transform : region2Transform);
		if (regionTransform == null) {
			return null;
		}
		if (regionTransform.equals("*")) {
			return happening;
		}
		List<String> names = new ArrayList<String>(2);
		List<String> regionNames = new ArrayList<String>(2);
		List<String> regexMatches = new ArrayList<String>(1);
		Matcher nations = Utils.NATION_PATTERN.matcher(happening);
		while(nations.find()) {
			names.add(happening.substring(nations.start() + 2, nations.end() - 2));
		}
		Matcher regions = Utils.REGION_PATTERN.matcher(happening);
		while(regions.find()) {
			regionNames.add(happening.substring(regions.start() + 2, regions.end() - 2));
		}
		for (Pattern regex : region1Regex) {
			Matcher matcher = regex.matcher(happening);
			while(matcher.find()) {
				regexMatches.add(happening.substring(matcher.start(), matcher.end()));
			}
		}
		String regionHappening = regionTransform;
		for (int i = 0; i < names.size(); i++) {
			regionHappening = regionHappening.replaceAll(Pattern.quote("@@NAME_" + (1 + i) + "@@"), "@@" + names.get(i) + "@@");
		}
		for (int i = 0; i < regionNames.size(); i++) {
			regionHappening = regionHappening.replaceAll(Pattern.quote("%%REGION_" + (1 + i) + "%%"), "%%" + regionNames.get(i) + "%%");
		}
		for (int i = 0; i < regexMatches.size(); i++) {
			regionHappening = regionHappening.replaceFirst("!![^\\s]*!!", regexMatches.get(i));
		}
		return regionHappening;
	}

	public String transformToRegion1Happening(String happening) {
		return transformToRegionHappening(1, happening);
	}

	public String transformToRegion2Happening(String happening) {
		return transformToRegionHappening(2, happening);
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