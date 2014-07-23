package com.afforess.assembly.amqp;

import java.io.IOException;
import java.util.concurrent.LinkedTransferQueue;
import java.util.concurrent.atomic.AtomicBoolean;

import play.Logger;
import play.libs.Json;

import com.fasterxml.jackson.databind.JsonNode;
import com.google.common.base.Charsets;
import com.rabbitmq.client.Channel;

public class AMQPThread extends Thread implements AMQPQueue {
	private final LinkedTransferQueue<JsonNode> queue = new LinkedTransferQueue<JsonNode>();
	private final Channel channel;
	private final String serverName;
	private final AtomicBoolean shutdown = new AtomicBoolean(false);
	public AMQPThread(Channel channel, String serverName) {
		super("AMQP Processing Thread");
		setDaemon(true);
		this.channel = channel;
		this.serverName = serverName;
	}

	@Override
	public void run() {
		try {
			while (!this.shutdown.get()) {
				processNode();
			}
		} finally {
			this.shutdown.set(true);
		}
	}

	private void processNode() {
		JsonNode node;
		try {
			node = queue.take();
		} catch (InterruptedException e) {
			Logger.error("Rabbitmq processing thread interrupted!", e);
			throw new RuntimeException(e);
		}
		try {
			channel.basicPublish("nspp", "", null, wrapNode(node).toString().getBytes(Charsets.UTF_8));
		} catch (IOException e) {
			Logger.error("Error publishing rabbitmq message, killing AMQP connection", e);
			throw new RuntimeException(e);
		}
	}

	@Override
	public boolean isShutdown() {
		return shutdown.get();
	}

	@Override
	public void shutdown() {
		shutdown.set(true);
	}

	private JsonNode wrapNode(JsonNode node) {
		return Json.toJson(new AMQPMessage(serverName, node));
	}

	@Override
	public void send(JsonNode node) {
		queue.add(node);
	}
}
