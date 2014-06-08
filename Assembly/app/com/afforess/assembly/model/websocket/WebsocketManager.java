package com.afforess.assembly.model.websocket;

import java.io.IOException;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import play.Logger;
import play.libs.Json;
import play.libs.F.Callback0;
import play.mvc.WebSocket;

import com.afforess.assembly.model.AMQPQueue;
import com.afforess.assembly.model.page.AMQPMessage;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.base.Charsets;
import com.rabbitmq.client.AMQP.BasicProperties;
import com.rabbitmq.client.Consumer;
import com.rabbitmq.client.Envelope;
import com.rabbitmq.client.ShutdownSignalException;

public class WebsocketManager implements Consumer {
	private final ConcurrentHashMap<Integer, Set<NationStatesWebSocket>> websockets = new ConcurrentHashMap<Integer, Set<NationStatesWebSocket>>();
	private final ConcurrentHashMap<PageType, Set<NationStatesWebSocket>> pages = new ConcurrentHashMap<PageType, Set<NationStatesWebSocket>>();
	private final AMQPQueue queue;
	private final ObjectMapper mapper = new ObjectMapper();
	private final String serverName;
	public WebsocketManager(AMQPQueue queue, String serverName) {
		this.queue = queue;
		this.serverName = serverName;
		for (PageType page : PageType.values()) {
			pages.put(page, new HashSet<NationStatesWebSocket>());
		}
	}

	protected void register(NationStatesWebSocket socket, WebSocket.In<JsonNode> in) {
		if (socket.getNationId() > -1) {
			Set<NationStatesWebSocket> sockets = websockets.get(socket.getNationId());
			if (sockets == null) {
				sockets = new HashSet<NationStatesWebSocket>();
				Set<NationStatesWebSocket> set = websockets.putIfAbsent(socket.getNationId(), sockets);
				if (set != null)
					sockets = set;
			}
			synchronized(sockets) {
				sockets.add(socket);
				in.onClose(new UnregisterCallback(socket.getNationId(), socket));
			}
			Set<NationStatesWebSocket> set = pages.get(socket.getPageType());
			synchronized(set) {
				set.add(socket);
			}
		}
	}

	/*
	public void write(int nationId, PageType page, JsonNode node) {
		Set<NationStatesWebSocket> sockets = websockets.get(nationId);
		if (sockets != null) {
			synchronized(sockets) {
				for (NationStatesWebSocket socket : sockets) {
					if (socket.getPageType() == page) {
						socket.write(node);
					}
				}
			}
		}
	}
	 */

	public void onUpdate(PageType page, RequestType type, DataRequest request, JsonNode node) {
		onUpdate(page, type, request, node, null);
	}

	public void onUpdate(PageType page, RequestType type, DataRequest request, JsonNode node, Set<Integer> nations) {
		onUpdate(page, type, request, node, nations, true);
	}

	private void onUpdate(PageType page, RequestType type, DataRequest request, JsonNode node, Set<Integer> nations, boolean sendMessage) {
		//Update all pages
		if (page == PageType.DEFAULT) {
			for (PageType t : PageType.values()) {
				if (t != PageType.DEFAULT)
					onUpdate(t, type, request, node, nations, false);
			}
		}
		if (sendMessage) {
			queue.send(Json.toJson(new WebsocketMessage(page, type, request, node, nations)));
		}
		Set<NationStatesWebSocket> set = pages.get(page);
		synchronized(set) {
			if (!set.isEmpty()) {
				for (NationStatesWebSocket socket : set) {
					if (nations == null || nations.contains(socket.getNationId())) {
						if (socket.getPage().isValidUpdate(type, request)) {
							socket.write(type, node);
						}
					}
				}
			}
		}
	}

	private class UnregisterCallback implements Callback0 {
		private final int nationId;
		private final NationStatesWebSocket socket;
		UnregisterCallback(int nationId, NationStatesWebSocket socket) {
			this.nationId = nationId;
			this.socket = socket;
		}

		@Override
		public void invoke() throws Throwable {
			Set<NationStatesWebSocket> sockets = websockets.get(nationId);
			synchronized(sockets) {
				sockets.remove(socket);
			}
			Set<NationStatesWebSocket> set = pages.get(socket.getPageType());
			synchronized(set) {
				set.remove(socket);
			}
		}
	}

	@Override
	public void handleConsumeOk(String consumerTag) {
	}

	@Override
	public void handleCancelOk(String consumerTag) {
	}

	@Override
	public void handleCancel(String consumerTag) throws IOException {
	}

	@Override
	public void handleDelivery(String consumerTag, Envelope envelope, BasicProperties properties, byte[] body) throws IOException {
		AMQPMessage message = mapper.readValue(body, new TypeReference<AMQPMessage>() {});
		Logger.info("Received rabbitmq message: " + new String(body, Charsets.UTF_8));
		if (!serverName.equals(message.getServerName())) {
			WebsocketMessage contents = mapper.readValue(message.getMessage().toString(), new TypeReference<WebsocketMessage>() { });
			onUpdate(contents.getPage(), contents.getType(), contents.getRequest(), contents.getNode(), contents.getNations(), false);
		} else {
			Logger.warn("Received rabbitmq message from ourselves: " + new String(body, Charsets.UTF_8));
		}
	}

	@Override
	public void handleShutdownSignal(String consumerTag, ShutdownSignalException sig) {
	}

	@Override
	public void handleRecoverOk(String consumerTag) {
	}
}
