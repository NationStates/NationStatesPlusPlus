package com.afforess.assembly.model;

import com.fasterxml.jackson.databind.JsonNode;

public class EmptyAMQPQueue implements AMQPQueue {
	@Override
	public void send(JsonNode node) {

	}
}
