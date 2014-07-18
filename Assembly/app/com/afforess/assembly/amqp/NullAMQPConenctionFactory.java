package com.afforess.assembly.amqp;

import java.io.IOException;

import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Consumer;

public class NullAMQPConenctionFactory extends AMQPConnectionFactory {

	public NullAMQPConenctionFactory() {
		super(null, 0, null, null, null);
	}

	@Override
	public AMQPQueue createQueue() throws IOException {
		return new EmptyAMQPQueue();
	}

	@Override
	public void registerConsumer(Consumer consumer) throws IOException {
		
	}

	@Override
	public Channel createChannel() throws IOException {
		throw new UnsupportedOperationException();
	}
}
