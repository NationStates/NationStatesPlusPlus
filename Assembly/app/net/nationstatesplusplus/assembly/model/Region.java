package net.nationstatesplusplus.assembly.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class Region {
	@JsonProperty
	private String name;
	@JsonProperty
	private String title;
	@JsonProperty
	private String flag;

	public Region() {
		
	}

	public Region(String name, String title, String flag) {
		this.name = name;
		this.title = title;
		this.flag = flag;
	}

	public String getFlag() {
		return flag;
	}

	public void setFlag(String flag) {
		this.flag = flag;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}
}
