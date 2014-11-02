package net.nationstatesplusplus.assembly.model.websocket;

import java.io.IOException;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;

import org.joda.time.Duration;

import net.nationstatesplusplus.assembly.amqp.AMQPConnectionFactory;
import net.nationstatesplusplus.assembly.amqp.AMQPMessage;
import net.nationstatesplusplus.assembly.amqp.AMQPQueue;
import net.nationstatesplusplus.assembly.amqp.EmptyAMQPQueue;
import play.Logger;
import play.libs.Json;
import play.libs.F.Callback0;
import play.mvc.WebSocket;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rabbitmq.client.AMQP.BasicProperties;
import com.rabbitmq.client.Consumer;
import com.rabbitmq.client.Envelope;
import com.rabbitmq.client.ShutdownSignalException;

public class WebsocketManager implements Consumer {
	private final ConcurrentHashMap<PageType, Set<NationStatesWebSocket>> pages = new ConcurrentHashMap<PageType, Set<NationStatesWebSocket>>();
	private final AMQPConnectionFactory factory;
	private final ObjectMapper mapper = new ObjectMapper();
	private final String serverName;
	private final AtomicReference<AMQPQueue> queue = new AtomicReference<AMQPQueue>(null);
	public WebsocketManager(AMQPConnectionFactory factory, String serverName) throws IOException {
		this.factory = factory;
		this.queue.set(factory != null ? factory.createQueue() : new EmptyAMQPQueue());
		this.serverName = serverName;
		for (PageType page : PageType.values()) {
			pages.put(page, new HashSet<NationStatesWebSocket>());
		}
		
		Thread watchdog = new Thread(new WebsocketWatchdog(), "Websocket Watchdog Thread");
		watchdog.setDaemon(true);
		watchdog.start();
	}

	protected void register(NationStatesWebSocket socket, WebSocket.In<JsonNode> in) {
		Set<NationStatesWebSocket> set = pages.get(socket.getPageType());
		synchronized(set) {
			set.add(socket);
			in.onClose(new UnregisterCallback(socket));
		}
		
		int total = 0;
		for (PageType page : PageType.values()) {
			Set<NationStatesWebSocket> sockets = pages.get(page);
			synchronized(sockets) {
				total += sockets.size();
			}
		}
		Logger.info("Currently " + total + " registered websockets");
	}

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
			AMQPQueue queue = this.queue.get();
			while (queue.isShutdown()) {
				Logger.info("Detected shutdown rabbitmq thread, attempting restart");
				AMQPQueue newQueue;
				try {
					newQueue = factory.createQueue();
					if (!this.queue.compareAndSet(queue, newQueue)) {
						queue = this.queue.get(); 
						newQueue.shutdown();
					} else {
						factory.registerConsumer(this);
					}
				} catch (IOException e) {
					Logger.error("Unable to restart rabbitmq connection! Message will be lost!", e);
					break;
				}
			}
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
		private final NationStatesWebSocket socket;
		UnregisterCallback(NationStatesWebSocket socket) {
			this.socket = socket;
		}

		@Override
		public void invoke() throws Throwable {
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
		if (!serverName.equals(message.getServerName())) {
			WebsocketMessage contents = mapper.readValue(message.getMessage().toString(), new TypeReference<WebsocketMessage>() { });
			onUpdate(contents.getPage(), contents.getType(), contents.getRequest(), contents.getNode(), contents.getNations(), false);
		}
	}

	@Override
	public void handleShutdownSignal(String consumerTag, ShutdownSignalException sig) {
	}

	@Override
	public void handleRecoverOk(String consumerTag) {
	}

	private class WebsocketWatchdog implements Runnable {
		@Override
		public void run() {
			while(true) {
				checkWebsockets();
				try {
					Thread.sleep(Duration.standardSeconds(30).getMillis());
				} catch (InterruptedException e) {
					Logger.info("WebsocketWatchdog interrupted", e);
					return;
				}
			}
		}

		public void checkWebsockets() {
			int removed = 0;
			for (PageType page : PageType.values()) {
				final Set<NationStatesWebSocket> sockets = pages.get(page);
				synchronized(sockets) {
					final long timeout = System.currentTimeMillis() - Duration.standardSeconds(30).getMillis();
					final Iterator<NationStatesWebSocket> iter = sockets.iterator();
					while(iter.hasNext()) {
						final NationStatesWebSocket websocket = iter.next();
						if (websocket.lastPing() < timeout) {
							iter.remove();
							try {
								websocket.close();
							} catch (Exception ignore) { }
							removed++;
						}
					}
				}
			}
			Logger.info("Closed and removed {} inactive websockets", removed);
		}
	}
}
