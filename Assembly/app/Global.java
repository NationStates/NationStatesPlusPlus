import java.io.File;
import java.lang.reflect.Constructor;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import org.apache.commons.dbutils.DbUtils;
import org.spout.cereal.config.ConfigurationNode;
import org.spout.cereal.config.yaml.YamlConfiguration;

import com.afforess.assembly.DailyDumps;
import com.afforess.assembly.NationUpdateTask;
import com.afforess.assembly.FlagUpdateTask;
import com.afforess.assembly.HappeningsTask;
import com.afforess.assembly.HealthMonitor;
import com.afforess.assembly.RecruitmentTask;
import com.afforess.assembly.Start;
import com.afforess.assembly.UpdateOrderTask;
import com.afforess.assembly.model.HappeningType;
import com.afforess.assembly.util.DatabaseAccess;
import com.amazonaws.auth.BasicAWSCredentials;
import com.google.common.collect.ObjectArrays;
import com.limewoodMedia.nsapi.NationStates;
import com.mchange.v2.c3p0.ComboPooledDataSource;

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
	private boolean logRequests = false;
	private final ConcurrentHashMap<Class<?>, Controller> controllers = new ConcurrentHashMap<Class<?>, Controller>();

	@Override
	public void onStart(Application app) {
		config = Start.loadConfig();
		ConfigurationNode settings = config.getChild("settings");
		logRequests = settings.getChild("log-requests").getBoolean(logRequests);
		pool = Start.loadDatabase(settings);
		if (pool == null) {
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
		api.setRateLimit(49);
		api.setUserAgent(settings.getChild("User-Agent").getString());
		api.setRelaxed(true);
		this.access = new DatabaseAccess(pool, settings.getChild("cache-size").getInt(1000));
		
		//AWS creds
		BasicAWSCredentials awsCredentials = null;
		ConfigurationNode aws = config.getChild("aws-credentials");
		if (aws.getChild("access-key").getString() != null && aws.getChild("secret-key").getString() != null) {
			awsCredentials = new BasicAWSCredentials(aws.getChild("access-key").getString(), aws.getChild("secret-key").getString());
		}

		//Setup health monitoring
		HealthMonitor health = null;
		if (config.getChild("health").getChild("monitor").getBoolean()) {
			Logger.info("Application Health Monitoring - ENABLED");
			health = new HealthMonitor(config.getChild("health"), access);
			health.start();
		} else {
			Logger.info("Application Health Monitoring - DISABLED");
		}

		this.admin = new AdminController(access, config, health);

		//Setup daily dumps
		File dumpsDir = new File(settings.getChild("dailydumps").getString());
		DailyDumps dumps = new DailyDumps(access, dumpsDir, settings.getChild("User-Agent").getString(), awsCredentials);
		Thread dailyDumps = new Thread(dumps);
		dailyDumps.setDaemon(true);
		dailyDumps.start();

		HappeningsTask task = new HappeningsTask(access, api, health);

		Akka.system().scheduler().schedule(Duration.create(5, TimeUnit.SECONDS), Duration.create(3, TimeUnit.SECONDS), task, Akka.system().dispatcher()); //3-10 api calls
		Akka.system().scheduler().schedule(Duration.create(60, TimeUnit.SECONDS), Duration.create(31, TimeUnit.SECONDS), new NationUpdateTask(api, access, 12, 12, health, task), Akka.system().dispatcher());
		Akka.system().scheduler().schedule(Duration.create(30, TimeUnit.SECONDS), Duration.create(30, TimeUnit.SECONDS), new RecruitmentTask(access), Akka.system().dispatcher()); // 1 api calls
		Akka.system().scheduler().schedule(Duration.create(120, TimeUnit.SECONDS), Duration.create(31, TimeUnit.SECONDS), new UpdateOrderTask(api, access), Akka.system().dispatcher()); // 2 api calls
		Akka.system().scheduler().schedule(Duration.create(120, TimeUnit.SECONDS), Duration.create(31, TimeUnit.SECONDS), new FlagUpdateTask(api, access), Akka.system().dispatcher()); // 4 api calls
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
/*

	private final AtomicLong requestId = new AtomicLong(0);
	@SuppressWarnings("rawtypes")
	@Override
	public Action onRequest(final Request request, Method actionMethod) {
		if (logRequests) {
			final long id = requestId.getAndIncrement();
			final long start = System.nanoTime();
			Logger.debug("LOGGING [ID: " + id + "] REQUEST FROM [" + request.remoteAddress() + "] TO [" + request.uri() + "]");
			final Action superAction = super.onRequest(request, actionMethod);
			final Action logAction = new StatusCodeAction(superAction, id, start);
			return logAction;
		}
		return super.onRequest(request, actionMethod);
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
*/
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