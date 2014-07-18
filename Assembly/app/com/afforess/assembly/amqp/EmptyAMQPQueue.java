package com.afforess.assembly.amqp;

import com.fasterxml.jackson.databind.JsonNode;

public class EmptyAMQPQueue implements AMQPQueue {
	@Override
	public void send(JsonNode node) {

	}

	public boolean isShutdown() {
		return false;
	}

	@Override
	public void shutdown() {

	}
}
