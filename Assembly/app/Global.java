import java.io.File;
import java.io.IOException;
import java.lang.reflect.Constructor;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

import org.apache.commons.dbutils.DbUtils;
import org.spout.cereal.config.ConfigurationNode;
import org.spout.cereal.config.yaml.YamlConfiguration;

import akka.dispatch.MessageDispatcher;

import com.afforess.assembly.AMQPThread;
import com.afforess.assembly.DailyDumps;
import com.afforess.assembly.NSWikiTask;
import com.afforess.assembly.NationUpdateTask;
import com.afforess.assembly.FlagUpdateTask;
import com.afforess.assembly.HappeningsTask;
import com.afforess.assembly.HealthMonitor;
import com.afforess.assembly.Start;
import com.afforess.assembly.UpdateOrderTask;
import com.afforess.assembly.WorldAssemblyTask;
import com.afforess.assembly.model.AMQPQueue;
import com.afforess.assembly.model.EmptyAMQPQueue;
import com.afforess.assembly.model.HappeningType;
import com.afforess.assembly.model.websocket.WebsocketManager;
import com.afforess.assembly.util.DatabaseAccess;
import com.amazonaws.auth.BasicAWSCredentials;
import com.google.common.collect.ObjectArrays;
import com.limewoodMedia.nsapi.NationStates;
import com.mchange.v2.c3p0.ComboPooledDataSource;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.ConnectionFactory;
import com.typesafe.config.Config;
import com.typesafe.config.ConfigFactory;

import controllers.AdminController;
import controllers.DatabaseController;
import controllers.NationStatesController;
import play.*;
import play.api.mvc.EssentialFilter;
import play.filters.gzip.GzipFilter;
import play.libs.Akka;
import play.mvc.Controller;
import scala.concurrent.duration.Duration;

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
			return;
		}

		Logger.info("NationStates++ Database Connection Pool Initialized.");

		Connection conn = null;
		try {
			conn = pool.getConnection();
			HappeningType.initialize(conn);
		} catch (SQLException e) {
			Logger.error("Unable to initialize happening types", e);
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
				((AMQPThread)queue).start();
				
				manager =  new WebsocketManager(queue, settings.getChild("server-name").getString());
				Channel channel = amqpConn.createChannel();
				
				String serverName = settings.getChild("server-name").getString();
				channel.queueDelete(serverName);
				channel.queueDeclare(serverName, false, false, false, null);
				channel.queueBind(serverName, "nspp", serverName);
				Logger.info("Created Rabbitmq Queue");
				channel.basicConsume(serverName, true, manager);

				Logger.info("NationStates++ RabbitMQ Connection Initialized.");
			} catch (IOException e) {
				Logger.error("Error initializing rabbitmq", e);
				return;
			}
		} else {
			Logger.warn("No rabbitmq configuration set. Rabbitmq will not be used.");
			queue = new EmptyAMQPQueue();
			manager = new WebsocketManager(queue, settings.getChild("server-name").getString());
		}

		this.access = new DatabaseAccess(pool, settings.getChild("cache-size").getInt(1000), manager, backgroundTasks);

		//Setup health monitoring
		HealthMonitor health = null;
		if (config.getChild("health").getChild("monitor").getBoolean()) {
			Logger.info("NationStates++ Health Monitoring: [ ENABLED ]");
			health = new HealthMonitor(config.getChild("health"), access, backgroundTasks);
			health.start();
		} else {
			Logger.info("NationStates++ Health Monitoring [ DISABLED ]");
		}

		this.admin = new AdminController(access, config, health);

		//Setup background tasks
		if (backgroundTasks) {
			//AWS creds
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

			Config c = ConfigFactory.load();
			final MessageDispatcher nsTasks = Akka.system().dispatchers().from(c.getObject("play.akka.actor.ns-tasks").toConfig());
			HappeningsTask task = new HappeningsTask(access, api, health);
			Akka.system().scheduler().schedule(Duration.create(5, TimeUnit.SECONDS), Duration.create(3, TimeUnit.SECONDS), task, nsTasks); //3-10 api calls
			Akka.system().scheduler().schedule(Duration.create(60, TimeUnit.SECONDS), Duration.create(31, TimeUnit.SECONDS), new NationUpdateTask(api, access, 12, 12, health, task), nsTasks);
			Akka.system().scheduler().schedule(Duration.create(120, TimeUnit.SECONDS), Duration.create(31, TimeUnit.SECONDS), new UpdateOrderTask(api, access), nsTasks); // 2 api calls
			Akka.system().scheduler().schedule(Duration.create(120, TimeUnit.SECONDS), Duration.create(31, TimeUnit.SECONDS), new FlagUpdateTask(api, access), nsTasks); // 4 api calls
			Akka.system().scheduler().schedule(Duration.create(120, TimeUnit.SECONDS), Duration.create(60, TimeUnit.SECONDS), new NSWikiTask(access, config), nsTasks); // 0 api calls
			Akka.system().scheduler().scheduleOnce(Duration.create(120, TimeUnit.SECONDS), new WorldAssemblyTask(access, api, 0), nsTasks);
			Akka.system().scheduler().scheduleOnce(Duration.create(160, TimeUnit.SECONDS), new WorldAssemblyTask(access, api, 1), nsTasks);
			Logger.info("NationStates++ Background Tasks Initialized.");
		}
	}

	@Override
	public void onStop(Application app) {
		pool.close();
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
			Constructor<A> cons = controllerClass.getConstructor(new Class[] {DatabaseAccess.class, YamlConfiguration.class, NationStates.class});
			A controller = cons.newInstance(access, config, api);
			controllers.put(controllerClass, (Controller) controller);
			return controller;
		} else if (DatabaseController.class.isAssignableFrom(controllerClass)) {
			Constructor<A> cons = controllerClass.getConstructor(new Class[] {DatabaseAccess.class, YamlConfiguration.class});
			A controller = cons.newInstance(access, config);
			controllers.put(controllerClass, (Controller) controller);
			return controller;
		}
		return super.getControllerInstance(controllerClass);
	}
}