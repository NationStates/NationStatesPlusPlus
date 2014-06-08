package com.afforess.assembly;

import java.io.IOException;
import java.util.concurrent.LinkedTransferQueue;

import play.Logger;
import play.libs.Json;

import com.afforess.assembly.model.AMQPQueue;
import com.afforess.assembly.model.page.AMQPMessage;
import com.fasterxml.jackson.databind.JsonNode;
import com.google.common.base.Charsets;
import com.rabbitmq.client.Channel;

public class AMQPThread extends Thread implements AMQPQueue {
	private final LinkedTransferQueue<JsonNode> queue = new LinkedTransferQueue<JsonNode>();
	private final Channel channel;
	private final String serverName;
	public AMQPThread(Channel channel, String serverName) {
		super("AMQP Processing Thread");
		setDaemon(true);
		this.channel = channel;
		this.serverName = serverName;
	}

	@Override
	public void run() {
		while (true) {
			JsonNode node;
			try {
				node = queue.take();
				process(node);
			} catch (InterruptedException e) { }
		}
	}

	private void process(JsonNode node) {
		try {
			Logger.info("Publishing: " + wrapNode(node).toString());
			channel.basicPublish("nspp", "", null, wrapNode(node).toString().getBytes(Charsets.UTF_8));
		} catch (IOException e) {
			Logger.error("Error publishing rabbitmq message", e);
		}
	}

	private JsonNode wrapNode(JsonNode node) {
		return Json.toJson(new AMQPMessage(serverName, node));
	}

	@Override
	public void send(JsonNode node) {
		queue.add(node);
	}
}
