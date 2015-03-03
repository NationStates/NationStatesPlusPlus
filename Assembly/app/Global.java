import java.io.File;
import java.io.IOException;
import java.io.PrintStream;
import java.lang.reflect.Constructor;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.concurrent.ConcurrentHashMap;

import net.nationstatesplusplus.assembly.DailyDumps;
import net.nationstatesplusplus.assembly.FlagUpdateTask;
import net.nationstatesplusplus.assembly.HappeningsTask;
import net.nationstatesplusplus.assembly.NSWikiTask;
import net.nationstatesplusplus.assembly.NationUpdateTask;
import net.nationstatesplusplus.assembly.RecruitmentTargetTask;
import net.nationstatesplusplus.assembly.RepeatingTaskThread;
import net.nationstatesplusplus.assembly.Start;
import net.nationstatesplusplus.assembly.UpdateOrderTask;
import net.nationstatesplusplus.assembly.WorldAssemblyTask;
import net.nationstatesplusplus.assembly.amqp.AMQPConnectionFactory;
import net.nationstatesplusplus.assembly.amqp.NullAMQPConenctionFactory;
import net.nationstatesplusplus.assembly.model.HappeningType;
import net.nationstatesplusplus.assembly.model.RecruitmentType;
import net.nationstatesplusplus.assembly.model.websocket.WebsocketManager;
import net.nationstatesplusplus.assembly.util.DatabaseAccess;
import net.nationstatesplusplus.assembly.logging.LoggerOutputStream;

import org.joda.time.Duration;
import org.slf4j.LoggerFactory;
import org.spout.cereal.config.ConfigurationNode;
import org.spout.cereal.config.yaml.YamlConfiguration;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.joran.JoranConfigurator;
import ch.qos.logback.core.joran.spi.JoranException;
import ch.qos.logback.core.util.StatusPrinter;

import com.google.common.collect.ObjectArrays;
import com.limewoodMedia.nsapi.NationStates;
import com.mchange.v2.c3p0.ComboPooledDataSource;
import com.mongodb.DB;
import com.mongodb.MongoClient;

import controllers.DatabaseController;
import controllers.NationStatesController;
import play.*;
import play.api.mvc.EssentialFilter;
import play.filters.gzip.GzipFilter;
import play.mvc.Controller;

public class Global extends GlobalSettings {
	private ComboPooledDataSource pool;
	private NationStates api;
	private DatabaseAccess access;
	private YamlConfiguration config;
	private final ConcurrentHashMap<Class<?>, Controller> controllers = new ConcurrentHashMap<Class<?>, Controller>();

	@Override
	public void onStart(Application app) {
		setupLogback();

		config = Start.loadConfig();
		final ConfigurationNode settings = config.getChild("settings");
		Logger.info("Beginning NationStates++ Application Server Startup [Server: {}]", settings.getChild("server-name").getString());

		pool = Start.loadDatabase(settings);
		if (pool == null) {
			exitWithError("Unable to connect to database");
		}
		Logger.info("NationStates++ Database Connection Pool Initialized.");

		
		try (Connection conn =  pool.getConnection()) {
			HappeningType.initialize(conn);
		} catch (SQLException e) {
			exitWithError("Unable to initialize happening types", e);
		}
		Logger.info("NationStates++ Happening Types Initialized.");

		final NationStates api = setupNationStatesAPI(settings.getChild("User-Agent").getString());

		final AMQPConnectionFactory amqpFactory = setupRabbitMqFactory(config.getChild("rabbit-mq"), settings.getChild("server-name").getString());
		final WebsocketManager manager;
		try {
			manager = new WebsocketManager(amqpFactory, settings.getChild("server-name").getString());
			amqpFactory.registerConsumer(manager);
			if (config.getChild("rabbit-mq") != null) {
				Logger.info("NationStates++ RabbitMQ Connection Initialized.");
			}
		} catch (IOException e) {
			exitWithError("Error initializing rabbitmq", e);
			return;
		}

		final boolean backgroundTasks = settings.getChild("background-tasks").getBoolean(true);
		Logger.info("NationStates++ Background Tasks: [ " + (backgroundTasks ? "ENABLED ]" : "DISABLED ]"));

		final MongoClient mongoClient = setupMongoDB(config);
		this.access = new DatabaseAccess(pool, mongoClient, settings.getChild("cache-size").getInt(1000), manager, backgroundTasks);

		// Setup background tasks
		if (backgroundTasks) {
			File dumpsDir = new File(settings.getChild("dailydumps").getString());
			DailyDumps dumps = new DailyDumps(access, dumpsDir, settings.getChild("User-Agent").getString());
			Thread dailyDumps = new Thread(dumps);
			dailyDumps.setDaemon(true);
			dailyDumps.start();

			//Schedule the task multiple times, staggered 10 seconds apart, repeating each minute
			HappeningsTask task = new HappeningsTask(access, api);
			for (int i = 0; i < 12; i++) {
				schedule(Duration.standardSeconds(5 + 10 * i), Duration.standardMinutes(2), task);
			}
			
			schedule(Duration.standardSeconds(60), Duration.standardSeconds(31), new NationUpdateTask(api, access, 12, 12));
			schedule(Duration.standardSeconds(120), Duration.standardSeconds(31), new UpdateOrderTask(api, access));
			schedule(Duration.standardSeconds(120), Duration.standardSeconds(31), new FlagUpdateTask(api, access));
			schedule(Duration.standardSeconds(120), Duration.standardSeconds(60), new NSWikiTask(access, config));
			schedule(Duration.standardSeconds(120), null, new WorldAssemblyTask(access, api, 0));
			schedule(Duration.standardSeconds(120), null, new WorldAssemblyTask(access, api, 1));
			for (int i = 0; i < RecruitmentType.values().length; i++) {
				final RecruitmentType type = RecruitmentType.values()[i];
				//Staggers the tasks 30 seconds apart
				schedule(Duration.standardMinutes(3).plus(Duration.standardSeconds(30 * i)), Duration.standardMinutes(6), new RecruitmentTargetTask(type, access));
			}
			Logger.info("NationStates++ Background Tasks Initialized.");
		}
	}

	private static void schedule(Duration initial, Duration repeating, Runnable task) {
		RepeatingTaskThread thread = new RepeatingTaskThread(initial, repeating, task);
		thread.start();
	}

	private static void exitWithError(String error) {
		exitWithError(error, null);
	}

	private static void exitWithError(String error, Throwable t) {
		Logger.error(error, t);
		System.exit(1);
	}
	
	private NationStates setupNationStatesAPI(String userAgent) {
		api = new NationStates();
		api.setRateLimit(49);
		api.setUserAgent(userAgent);
		api.setRelaxed(true);
		return api;
	}

	private static AMQPConnectionFactory setupRabbitMqFactory(ConfigurationNode rabbitmq, String serverName) {
		if (rabbitmq != null) {
			return new AMQPConnectionFactory(rabbitmq.getChild("host").getString(), rabbitmq.getChild("port").getInt(), rabbitmq.getChild("user").getString(), rabbitmq.getChild("password").getString(), serverName);
		} else {
			Logger.warn("No rabbitmq configuration set. Rabbitmq will not be used.");
			return new NullAMQPConenctionFactory();
		}
	}

	private static MongoClient setupMongoDB(YamlConfiguration config) {
		MongoClient mongoClient = null;
		final int port = config.getChild("mongodb").getChild("port").getInt();

		try {
			mongoClient = new MongoClient("127.0.0.1", port);
			DB db = mongoClient.getDB("nspp");
			Logger.info("MongoDB stats: {}", db.getStats());
			return mongoClient;
		} catch (Exception e) {
			exitWithError("Unable to connect to mongodb", e);
			throw new RuntimeException(e);
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
		if (NationStatesController.class.isAssignableFrom(controllerClass)) {
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

	private static void setupLogback() {
		LoggerContext context = (LoggerContext) LoggerFactory.getILoggerFactory();
		Logger.info("Setting up Logback");
		Logger.info("Application running from: {}", Start.getApplicationDirectory().getAbsolutePath());
		System.setProperty("application.home", Start.getApplicationDirectory().getAbsolutePath());
		File xmlConfig = new File(new File(Start.getApplicationDirectory(), "conf"), "application-logger.xml");
		if (xmlConfig.exists()) {
			try {
				JoranConfigurator configurator = new JoranConfigurator();
				configurator.setContext(context);
				context.reset();
				configurator.doConfigure(xmlConfig);
			} catch (JoranException je) {
				// StatusPrinter will handle this
			}
		}
		//System.setOut(new PrintStream(new LoggerOutputStream(Level.INFO, Logger.underlying()), true));
		System.setErr(new PrintStream(new LoggerOutputStream(Level.OFF, Logger.underlying()), true));
		Logger.info("Logback Setup");
		StatusPrinter.printInCaseOfErrorsOrWarnings(context);
	}
}
