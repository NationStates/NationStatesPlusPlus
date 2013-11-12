import java.beans.PropertyVetoException;
import java.io.File;
import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

import org.apache.commons.dbutils.DbUtils;
import org.spout.cereal.config.ConfigurationException;
import org.spout.cereal.config.ConfigurationNode;
import org.spout.cereal.config.yaml.YamlConfiguration;

import com.afforess.assembly.DailyDumps;
import com.afforess.assembly.EndorsementMonitoring;
import com.afforess.assembly.HappeningsTask;
import com.afforess.assembly.HealthMonitor;
import com.afforess.assembly.RecruitmentTask;
import com.afforess.assembly.UpdateOrderTask;
import com.afforess.assembly.model.HappeningType;
import com.afforess.assembly.util.DatabaseAccess;
import com.amazonaws.auth.BasicAWSCredentials;
import com.google.common.collect.ObjectArrays;
import com.limewoodMedia.nsapi.NationStates;
import com.mchange.v2.c3p0.ComboPooledDataSource;

import controllers.DatabaseController;
import controllers.FirebaseAuthenticator;
import controllers.NationStatesController;
import play.*;
import play.api.mvc.EssentialFilter;
import play.api.mvc.PlainResult;
import play.extras.iteratees.GzipFilter;
import play.libs.Akka;
import play.mvc.Action;
import play.mvc.Http.Context;
import play.mvc.Http.Request;
import scala.concurrent.duration.Duration;

public class Global extends GlobalSettings {
	private ComboPooledDataSource pool;
	private FirebaseAuthenticator firebase;
	private NationStates api;
	private DatabaseAccess access;
	private YamlConfiguration config;

	@Override
	public void onStart(Application app) {
		config = new YamlConfiguration(new File("./config.yml"));
		try {
			config.load();
		} catch (ConfigurationException e1) {
			Logger.error("Unable to parse configuration", e1);
			throw new RuntimeException(e1);
		}
		ConfigurationNode settings = config.getChild("settings");
		try {
			Logger.info("Initializing database connection pool to [ " + settings.getChild("jbdc").getString() + " ]");
			//Connection Driver
			Class.forName("com.mysql.jdbc.Driver");
			pool = new ComboPooledDataSource();
			pool.setDriverClass("com.mysql.jdbc.Driver");
			pool.setJdbcUrl(settings.getChild("jbdc").getString());

			//Connection Pooling
			pool.setMaxPoolSize(50);
			pool.setMinPoolSize(1);

			pool.setMaxIdleTime(600); // 10 min after being unused, conn is closed
			pool.setMaxConnectionAge(60 * 60); //1 hr after connection is open, it is closed

			//Connection Debugging
			pool.setDebugUnreturnedConnectionStackTraces(true);
			pool.setUnreturnedConnectionTimeout(60 * 60);

			//Statement caching
			pool.setMaxStatementsPerConnection(25);

			//Connection testing
			pool.setTestConnectionOnCheckin(true);
			pool.setTestConnectionOnCheckout(true);
			pool.setPreferredTestQuery("SELECT 1");

			//Connection Auth
			Logger.info("Authenticating database connection pool with user [ " + settings.getChild("user").getString() + " ]");
			pool.setUser(settings.getChild("user").getString());
			pool.setPassword(settings.getChild("password").getString());
		} catch (ClassNotFoundException e) {
			Logger.error("No Database driver found!", e);
			return;
		} catch (PropertyVetoException e) {
			Logger.error("No Database driver found!", e);
			return;
		}
		
		Connection conn = null;
		try {
			conn = pool.getConnection();
			HappeningType.initialize(conn);
		} catch (SQLException e) {
			Logger.error("Unable to initialize happening types", e);
		} finally {
			DbUtils.closeQuietly(conn);
		}
		
		api = new NationStates();
		api.setRateLimit(47);
		api.setUserAgent(settings.getChild("User-Agent").getString());
		api.setRelaxed(true);
		this.access = new DatabaseAccess(pool);
		
		//Setup health monitoring
		HealthMonitor health = null;
		if (config.getChild("health").getChild("monitor").getBoolean()) {
			Logger.info("Application Health Monitoring - ENABLED");
			health = new HealthMonitor(config.getChild("health"), access);
			health.start();
		} else {
			Logger.info("Application Health Monitoring - DISABLED");
		}
		

		//Setup firebase
		ConfigurationNode firebaseConfig = config.getChild("firebase");
		firebase = new FirebaseAuthenticator(access, config, firebaseConfig.getChild("token").getString(), api);

		//Setup daily dumps
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

		Akka.system().scheduler().schedule(Duration.create(2, TimeUnit.SECONDS), Duration.create(3, TimeUnit.SECONDS), new HappeningsTask(access, api, health), Akka.system().dispatcher());
		Akka.system().scheduler().schedule(Duration.create(30, TimeUnit.SECONDS), Duration.create(30, TimeUnit.SECONDS), new EndorsementMonitoring(api, access, 20, health), Akka.system().dispatcher());
		Akka.system().scheduler().schedule(Duration.create(30, TimeUnit.SECONDS), Duration.create(30, TimeUnit.SECONDS), new RecruitmentTask(access), Akka.system().dispatcher());
		Akka.system().scheduler().schedule(Duration.create(30, TimeUnit.SECONDS), Duration.create(30, TimeUnit.SECONDS), new UpdateOrderTask(api, access), Akka.system().dispatcher());
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

	private final AtomicLong requestId = new AtomicLong(0);
	@SuppressWarnings("rawtypes")
	@Override
	public Action onRequest(final Request request, Method actionMethod) {
		final long id = requestId.getAndIncrement();
		final long start = System.nanoTime();
		Logger.debug("LOGGING [ID: " + id + "] REQUEST FROM [" + request.remoteAddress().split(",")[0] + "] TO [" + request.uri() + "]");
		final Action superAction = super.onRequest(request, actionMethod);
		final Action logAction = new StatusCodeAction(superAction, id, start);
		return logAction;
	}

	private static class StatusCodeAction extends Action.Simple {
		@SuppressWarnings("rawtypes")
		private final Action superAction;
		private final long id;
		private final long start;
		public StatusCodeAction(@SuppressWarnings("rawtypes") Action superAction, long id, long start) {
			this.superAction = superAction;
			this.id = id;
			this.start = start;
		}

		@SuppressWarnings("unchecked")
		@Override
		public play.mvc.Result call(Context ctx) throws Throwable {
			if (superAction.delegate == null) {
				superAction.delegate = delegate;
			}
			int status = -1;
			try {
				play.mvc.Result superResult = superAction.call(ctx);
				if (superResult.getWrappedResult() instanceof PlainResult) {
					PlainResult plain = (PlainResult)(superResult.getWrappedResult());
					status = plain.header().status();
				}
				return superResult;
			} finally {
				Logger.debug("LOGGING [ID: " + id + "] REQUEST COMPLETED [STATUS: " + status + "] IN [" + ((System.nanoTime() - start) / 1E6D) + " ms]");
			}
		}
	}

	@SuppressWarnings("unchecked")
	@Override
	public <A> A getControllerInstance(Class<A> controllerClass) throws Exception {
		if (FirebaseAuthenticator.class.isAssignableFrom(controllerClass)) {
			return (A) firebase;
		} else if (NationStatesController.class.isAssignableFrom(controllerClass)) {
			Constructor<A> cons = controllerClass.getConstructor(new Class[] {DatabaseAccess.class, YamlConfiguration.class, NationStates.class});
			return cons.newInstance(access, config, api);
		} else if (DatabaseController.class.isAssignableFrom(controllerClass)) {
			Constructor<A> cons = controllerClass.getConstructor(new Class[] {DatabaseAccess.class, YamlConfiguration.class});
			return cons.newInstance(access, config);
		}
		return super.getControllerInstance(controllerClass);
	}
}