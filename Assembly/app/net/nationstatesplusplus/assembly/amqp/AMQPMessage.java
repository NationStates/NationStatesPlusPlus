package net.nationstatesplusplus.assembly.amqp;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class AMQPMessage {
	@JsonProperty("serverName")
	private final String serverName;
	@JsonProperty("message")
	private final JsonNode message;

	@JsonCreator
	public AMQPMessage(@JsonProperty("serverName") String serverName, @JsonProperty("message") JsonNode message) {
		this.serverName = serverName;
		this.message = message;
	}

	public String getServerName() {
		return serverName;
	}

	public JsonNode getMessage() {
		return message;
	}
}
