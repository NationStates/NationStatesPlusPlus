package net.nationstatesplusplus.assembly.model.websocket;

import java.util.Set;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class WebsocketMessage {
	@JsonProperty("page")
	private final PageType page;
	@JsonProperty("type")
	private final RequestType type;
	@JsonProperty("request")
	private final DataRequest request;
	@JsonProperty("node")
	private final JsonNode node;
	@JsonProperty("nations")
	private final Set<Integer> nations;

	@JsonCreator
	public WebsocketMessage(@JsonProperty("page") PageType page, @JsonProperty("type") RequestType type, @JsonProperty("request") DataRequest request, @JsonProperty("node") JsonNode node, @JsonProperty("nations") Set<Integer> nations) {
		this.page = page;
		this.type = type;
		this.request = request;
		this.node = node;
		this.nations = nations;
	}

	public PageType getPage() {
		return page;
	}

	public RequestType getType() {
		return type;
	}

	public DataRequest getRequest() {
		return request;
	}

	public JsonNode getNode() {
		return node;
	}

	public Set<Integer> getNations() {
		return nations;
	}
}
