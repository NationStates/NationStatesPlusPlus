package com.afforess.assembly.amqp;

import com.fasterxml.jackson.databind.JsonNode;

public interface AMQPQueue {

	public void send(JsonNode node);

	public boolean isShutdown();

	public void shutdown();
}
