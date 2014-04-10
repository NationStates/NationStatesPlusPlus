package controllers;

import java.util.HashMap;
import java.util.Map;

import com.fasterxml.jackson.databind.JsonNode;

import play.Logger;
import play.libs.Json;
import play.libs.F.Callback;
import play.mvc.WebSocket;

public class WebSocketController {
	public WebSocket<JsonNode> index() {
		return new WebSocket<JsonNode>() {
			@Override
			public void onReady(final WebSocket.In<JsonNode> in, final WebSocket.Out<JsonNode> out) {
				in.onMessage(new Callback<JsonNode>() {
					@Override
					public void invoke(JsonNode a) throws Throwable {
						JsonNode page = a.get("page");
						Logger.info("WS Page: " + page);
						String pageName = page.asText();
						Logger.info("WS Page Name: " + pageName);
						Map<String, String> data = new HashMap<String, String>();
						data.put("data", "Hello World!");
						out.write(Json.toJson(data));
					}
				});
			}
		};
	}
}
