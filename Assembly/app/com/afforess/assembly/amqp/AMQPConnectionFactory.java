package com.afforess.assembly.amqp;

import java.io.IOException;

import play.Logger;

import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
import com.rabbitmq.client.Consumer;
import com.rabbitmq.client.ShutdownSignalException;

public class AMQPConnectionFactory {
	private final String host;
	private final int port;
	private final String user;
	private final String pass;
	private String serverName;
	public AMQPConnectionFactory(String host, int port, String user, String pass, String serverName) {
		this.host = host;
		this.port = port;
		this.user = user;
		this.pass = pass;
		this.serverName = serverName;
	}

	public AMQPQueue createQueue() throws IOException {
		AMQPThread queue = new AMQPThread(createChannel(), serverName);
		queue.start();
		return queue;
	}

	public Channel createChannel() throws IOException {
		ConnectionFactory factory = new ConnectionFactory();
		factory.setUsername(user);
		factory.setPassword(pass);
		factory.setHost(host);
		factory.setPort(port);

		Connection amqpConn = factory.newConnection();
		return amqpConn.createChannel();
	}

	public void registerConsumer(Consumer consumer) throws IOException {
		Channel channel = createChannel();
		channel.queueDelete(serverName);
		channel.queueDeclare(serverName, false, false, false, null);
		try {
			channel.queueBind(serverName, "nspp", serverName);
		} catch (IOException e) {
			if (e.getCause() instanceof ShutdownSignalException && ((ShutdownSignalException) e.getCause()).getMessage().contains("no exchange 'nspp' in vhost")) {
				Logger.warn("No NSPP exchange present, creating one...");
				channel = createChannel();
				channel.exchangeDeclare("nspp", "fanout", false);
				channel.queueBind(serverName, "nspp", serverName);
			} else {
				throw e;
			}
		}
		Logger.info("Created Rabbitmq Queue");
		channel.basicConsume(serverName, true, consumer);
	}
}
