package net.nationstatesplusplus.assembly.mongodb;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.util.LinkedList;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

import org.apache.commons.io.IOUtils;

import net.schmizz.sshj.SSHClient;
import net.schmizz.sshj.connection.channel.OpenFailException;
import net.schmizz.sshj.connection.channel.direct.LocalPortForwarder;
import play.Logger;

public class PortForwardingRunnable implements Runnable {
	private final String remoteHost;
	private final int port;
	private final String user;
	private final String fingerprint;
	private final AtomicBoolean shutdown = new AtomicBoolean(false);
	private final AtomicReference<Runnable> callback;
	private final AtomicReference<ServerSocket> socket = new AtomicReference<ServerSocket>(null);
	private final AtomicReference<SSHClient> sshClient = new AtomicReference<SSHClient>(null);
	public PortForwardingRunnable(String remoteHost, int port, String user, String fingerprint, Runnable callback) {
		this.remoteHost = remoteHost;
		this.port = port;
		this.user = user;
		this.fingerprint = fingerprint;
		this.callback = new AtomicReference<Runnable>(callback);
		synchronized(forwardingClients) {
			forwardingClients.add(this);
		}
	}

	public boolean isShutdown() {
		return shutdown.get();
	}

	public void shutdown() {
		callback.set(null);
		ServerSocket ss = socket.get();
		if (ss != null) {
			try {
				ss.close();
			} catch (IOException e) {
				Logger.error("Error closing socket during shutdown", e);
			}
		}
		socket.set(null);
		
		SSHClient client = sshClient.get();
		if (client != null) {
			try {
				client.close();
			} catch (IOException e) {
				Logger.error("Error closing ssh client during shutdown", e);
			}
		}
		sshClient.set(null);
	}

	@Override
	public void run() {
		final SSHClient client = new SSHClient();
		client.addHostKeyVerifier(fingerprint);
		client.getTransport().setHeartbeatInterval(30);
		try {
			client.connect(remoteHost);
			client.authPublickey(user);
			Logger.info("Authenticated SSH Connection: " + client.isAuthenticated());
			this.sshClient.set(client);
		} catch (IOException e) {
			Logger.error("Unable to ssh to host", e);
			return;
		} finally {
			shutdown.set(true);
		}

		try {
			final LocalPortForwarder.Parameters params = new LocalPortForwarder.Parameters("127.0.0.1", port, "127.0.0.1", port);
			try (ServerSocket ss = new ServerSocket()) {
				ss.setReuseAddress(true);
				ss.bind(new InetSocketAddress(params.getLocalHost(), params.getLocalPort()));
				this.socket.set(ss);
				client.newLocalPortForwarder(params, ss).listen();
			} finally {
				IOUtils.closeQuietly(client);
			}
		} catch (OpenFailException e) {
			Logger.error("Exception in ssh client port forwarding", e);
			Logger.error("Disconnect reason: " + e.getDisconnectReason());
			Logger.error("Exception reason: " + e.getReason());
			Logger.error("Exception message: " + e.getMessage());
		} catch (Exception e) {
			Logger.error("Exception in ssh client port forwarding", e);
		} finally {
			shutdown.set(true);
			socket.set(null);
			sshClient.set(null);
			Logger.warn("SSH port forwarding is closing");
			Runnable callback = this.callback.get();
			if (callback != null) {
				callback.run();
			}
		}
	}

	private static final List<PortForwardingRunnable> forwardingClients = new LinkedList<PortForwardingRunnable>();
	public static void initialize(String remoteHost, int port, String user, String fingerprint) {
		CreatePortForwardingThread createForwarding = new CreatePortForwardingThread(remoteHost, port, user, fingerprint);
		createForwarding.run();
	}

	public static void shutdownAll() {
		synchronized(forwardingClients) {
			for (PortForwardingRunnable runnable : forwardingClients) {
				if (!runnable.isShutdown()) {
					runnable.shutdown();
				}
			}
			forwardingClients.clear();
		}
	}

	public static int totalClients() {
		synchronized(forwardingClients) {
			return forwardingClients.size();
		}
	}

	private static class CreatePortForwardingThread implements Runnable {
		private final String remoteHost;
		private final int port;
		private final String user;
		private final String fingerprint;
		public CreatePortForwardingThread(String remoteHost, int port, String user, String fingerprint) {
			this.remoteHost = remoteHost;
			this.port = port;
			this.user = user;
			this.fingerprint = fingerprint;
		}
	
		@Override
		public void run() {
			Logger.info("Starting port forwarding listening thread");
			Thread listenThread = new Thread(new PortForwardingRunnable(remoteHost, port, user, fingerprint, this), "Mongodb port forwarding thread");
			listenThread.start();
		}
	}
}
