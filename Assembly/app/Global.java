import java.io.File;
import java.io.IOException;
import java.lang.reflect.Constructor;
import java.net.UnknownHostException;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.concurrent.ConcurrentHashMap;
import org.apache.commons.dbutils.DbUtils;
import org.joda.time.Duration;
import org.spout.cereal.config.ConfigurationNode;
import org.spout.cereal.config.yaml.YamlConfiguration;

import com.afforess.assembly.AMQPThread;
import com.afforess.assembly.DailyDumps;
import com.afforess.assembly.NSWikiTask;
import com.afforess.assembly.NationUpdateTask;
import com.afforess.assembly.FlagUpdateTask;
import com.afforess.assembly.HappeningsTask;
import com.afforess.assembly.HealthMonitor;
import com.afforess.assembly.RepeatingTaskThread;
import com.afforess.assembly.Start;
import com.afforess.assembly.UpdateOrderTask;
import com.afforess.assembly.WorldAssemblyTask;
import com.afforess.assembly.model.AMQPQueue;
import com.afforess.assembly.model.EmptyAMQPQueue;
import com.afforess.assembly.model.HappeningType;
import com.afforess.assembly.model.websocket.WebsocketManager;
import com.afforess.assembly.mongodb.PortForwardingRunnable;
import com.afforess.assembly.util.DatabaseAccess;
import com.amazonaws.auth.BasicAWSCredentials;
import com.google.common.collect.ObjectArrays;
import com.limewoodMedia.nsapi.NationStates;
import com.mchange.v2.c3p0.ComboPooledDataSource;
import com.mongodb.DB;
import com.mongodb.MongoClient;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.ConnectionFactory;
import com.rabbitmq.client.ShutdownSignalException;

import controllers.AdminController;
import controllers.DatabaseController;
import controllers.NationStatesController;
import play.*;
import play.api.mvc.EssentialFilter;
import play.filters.gzip.GzipFilter;
import play.mvc.Controller;

public class Global extends GlobalSettings {
	private ComboPooledDataSource pool;
	private AdminController admin;
	private NationStates api;
	private DatabaseAccess access;
	private YamlConfiguration config;
	private final ConcurrentHashMap<Class<?>, Controller> controllers = new ConcurrentHashMap<Class<?>, Controller>();

	@Override
	public void onStart(Application app) {
		config = Start.loadConfig();
		ConfigurationNode settings = config.getChild("settings");

		Logger.info("Beginning NationStates++ Application Server Startup [Server: " + settings.getChild("server-name").getString() + "]");

		pool = Start.loadDatabase(settings);
		if (pool == null) {
			Logger.error("Unable to connect to database");
			System.exit(1);
		}

		Logger.info("NationStates++ Database Connection Pool Initialized.");

		Connection conn = null;
		try {
			conn = pool.getConnection();
			HappeningType.initialize(conn);
		} catch (SQLException e) {
			Logger.error("Unable to initialize happening types", e);
			System.exit(1);
		} finally {
			DbUtils.closeQuietly(conn);
		}

		Logger.info("NationStates++ Happening Types Initialized.");

		final boolean backgroundTasks = settings.getChild("background-tasks").getBoolean(true);
		Logger.info("NationStates++ Background Tasks: [ " + (backgroundTasks ? "ENABLED ]" : "DISABLED ]"));

		api = new NationStates();
		api.setRateLimit(49);
		api.setUserAgent(settings.getChild("User-Agent").getString());
		api.setRelaxed(true);

		Logger.info("NationStates++ API Initialized.");

		WebsocketManager manager;
		AMQPQueue queue;
		ConfigurationNode rabbitmq = config.getChild("rabbit-mq");
		if (rabbitmq != null) {
			ConnectionFactory factory = new ConnectionFactory();
			factory.setUsername(rabbitmq.getChild("user").getString());
			factory.setPassword(rabbitmq.getChild("password").getString());
			factory.setHost(rabbitmq.getChild("host").getString());
			factory.setPort(rabbitmq.getChild("port").getInt());
			try {
				com.rabbitmq.client.Connection amqpConn = factory.newConnection();
				queue = new AMQPThread(amqpConn.createChannel(), settings.getChild("server-name").getString());
				((AMQPThread) queue).start();

				manager = new WebsocketManager(queue, settings.getChild("server-name").getString());
				Channel channel = amqpConn.createChannel();

				String serverName = settings.getChild("server-name").getString();
				channel.queueDelete(serverName);
				channel.queueDeclare(serverName, false, false, false, null);
				try {
					channel.queueBind(serverName, "nspp", serverName);
				} catch (IOException e) {
					if (e.getCause() instanceof ShutdownSignalException && ((ShutdownSignalException) e.getCause()).getMessage().contains("no exchange 'nspp' in vhost")) {
						Logger.warn("No NSPP exchange present, creating one...");
						channel = amqpConn.createChannel();
						channel.exchangeDeclare("nspp", "fanout", false);
						channel.queueBind(serverName, "nspp", serverName);
					} else {
						throw e;
					}
				}
				Logger.info("Created Rabbitmq Queue");
				channel.basicConsume(serverName, true, manager);

				Logger.info("NationStates++ RabbitMQ Connection Initialized.");
			} catch (IOException e) {
				Logger.error("Error initializing rabbitmq", e);
				System.exit(1);
				return;
			}
		} else {
			Logger.warn("No rabbitmq configuration set. Rabbitmq will not be used.");
			queue = new EmptyAMQPQueue();
			manager = new WebsocketManager(queue, settings.getChild("server-name").getString());
		}

		MongoClient mongoClient = null;
		final int port = config.getChild("mongodb").getChild("port").getInt();
		final String remoteHost = config.getChild("mongodb").getChild("host").getString();
		final String user = config.getChild("mongodb").getChild("user").getString();
		final String fingerprint = config.getChild("mongodb").getChild("fingerprint").getString();
		
		Runnable createListener = new Runnable() {
			@Override
			public void run() {
				Logger.info("Starting port forwarding listening thread");
				Thread listenThread = new Thread(new PortForwardingRunnable(remoteHost, port, user, fingerprint, this), "Mongodb port forwarding thread");
				listenThread.start();
			}
		};
		createListener.run();

		try {
			Thread.sleep(3000L);
		} catch (InterruptedException e1) {	}
		
		Logger.info("Binding port forwarding for mongodb on {} with port {}", remoteHost, port);

		try {
			mongoClient = new MongoClient("127.0.0.1", port);
			DB db = mongoClient.getDB("nspp");
			Logger.info("MongoDB stats: " + db.getStats());
		} catch (UnknownHostException e) {
			Logger.error("Unable to connect to mongodb", e);
			System.exit(1);
		}

		this.access = new DatabaseAccess(pool, mongoClient, settings.getChild("cache-size").getInt(1000), manager, backgroundTasks);

		// Setup health monitoring
		HealthMonitor health = null;
		if (config.getChild("health").getChild("monitor").getBoolean()) {
			Logger.info("NationStates++ Health Monitoring: [ ENABLED ]");
			health = new HealthMonitor(config.getChild("health"), access, backgroundTasks);
			health.start();
		} else {
			Logger.info("NationStates++ Health Monitoring [ DISABLED ]");
		}

		this.admin = new AdminController(access, config, health);

		// Setup background tasks
		if (backgroundTasks) {
			// AWS creds
			BasicAWSCredentials awsCredentials = null;
			ConfigurationNode aws = config.getChild("aws-credentials");
			if (aws.getChild("access-key").getString() != null && aws.getChild("secret-key").getString() != null) {
				awsCredentials = new BasicAWSCredentials(aws.getChild("access-key").getString(), aws.getChild("secret-key").getString());
			}

			File dumpsDir = new File(settings.getChild("dailydumps").getString());
			DailyDumps dumps = new DailyDumps(access, dumpsDir, settings.getChild("User-Agent").getString(), awsCredentials);
			Thread dailyDumps = new Thread(dumps);
			dailyDumps.setDaemon(true);
			dailyDumps.start();

			HappeningsTask task = new HappeningsTask(access, api, health);
			schedule(Duration.standardSeconds(5), Duration.standardSeconds(3), task); // 3-10 api calls
			schedule(Duration.standardSeconds(60), Duration.standardSeconds(31), new NationUpdateTask(api, access, 12, 12, health, task));
			schedule(Duration.standardSeconds(120), Duration.standardSeconds(31), new UpdateOrderTask(api, access)); // 2 api calls
			schedule(Duration.standardSeconds(120), Duration.standardSeconds(31), new FlagUpdateTask(api, access)); // 4 api calls
			schedule(Duration.standardSeconds(120), Duration.standardSeconds(60), new NSWikiTask(access, config)); // 0 api calls
			schedule(Duration.standardSeconds(120), null, new WorldAssemblyTask(access, api, 0)); // 3-10 api calls
			schedule(Duration.standardSeconds(120), null, new WorldAssemblyTask(access, api, 1)); // 3-10 api calls
			Logger.info("NationStates++ Background Tasks Initialized.");
		}
	}

	private static void schedule(Duration initial, Duration repeating, Runnable task) {
		RepeatingTaskThread thread = new RepeatingTaskThread(initial, repeating, task);
		thread.start();
	}

	@Override
	public void onStop(Application app) {
		pool.close();
		PortForwardingRunnable.shutdownAll();
	}

	@SuppressWarnings("unchecked")
	@Override
	public <T extends EssentialFilter> Class<T>[] filters() {
		return (Class[]) ObjectArrays.concat(GzipFilter.class, super.filters());
	}

	@SuppressWarnings("unchecked")
	@Override
	public <A> A getControllerInstance(Class<A> controllerClass) throws Exception {
		if (controllers.containsKey(controllerClass)) {
			return (A) controllers.get(controllerClass);
		}
		if (AdminController.class.isAssignableFrom(controllerClass)) {
			return (A) admin;
		} else if (NationStatesController.class.isAssignableFrom(controllerClass)) {
			Constructor<A> cons = controllerClass.getConstructor(new Class[] { DatabaseAccess.class, YamlConfiguration.class, NationStates.class });
			A controller = cons.newInstance(access, config, api);
			controllers.put(controllerClass, (Controller) controller);
			return controller;
		} else if (DatabaseController.class.isAssignableFrom(controllerClass)) {
			Constructor<A> cons = controllerClass.getConstructor(new Class[] { DatabaseAccess.class, YamlConfiguration.class });
			A controller = cons.newInstance(access, config);
			controllers.put(controllerClass, (Controller) controller);
			return controller;
		}
		return super.getControllerInstance(controllerClass);
	}
}