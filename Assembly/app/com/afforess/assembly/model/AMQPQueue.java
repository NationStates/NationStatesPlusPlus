package com.afforess.assembly.model;

import com.fasterxml.jackson.databind.JsonNode;

public interface AMQPQueue {

	public void send(JsonNode node);
}
