package com.afforess.assembly.model;


import org.codehaus.jackson.annotate.JsonProperty;

public class Nation implements Comparable<Nation>{
	@JsonProperty
	public String name;

	@JsonProperty
	public String region;

	@JsonProperty
	public long timestamp;

	@JsonProperty
	public String status;

	@JsonProperty
	public int civilRights;

	@JsonProperty
	public int economy;

	@JsonProperty
	public int politicalFreedom;

	@JsonProperty
	public int taxRate;

	@JsonProperty
	public String motto;

	@JsonProperty
	public String flagUrl;

	@Override
	public int compareTo(Nation o) {
		return Long.compare(o.timestamp, timestamp);
	}

	@Override
	public boolean equals(Object o) {
		if (o instanceof Nation) {
			return ((Nation) o).name.equals(name);
		}
		return false;
	}

	@Override
	public int hashCode() {
		return name.hashCode();
	}
}
