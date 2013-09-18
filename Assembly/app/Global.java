import java.beans.PropertyVetoException;
import java.io.File;
import java.lang.reflect.Constructor;
import java.util.concurrent.TimeUnit;

import org.spout.cereal.config.ConfigurationException;
import org.spout.cereal.config.ConfigurationNode;
import org.spout.cereal.config.yaml.YamlConfiguration;

import com.afforess.assembly.DailyDumps;
import com.afforess.assembly.HappeningsTask;
import com.afforess.assembly.RegionMonitoring;
import com.afforess.assembly.UpdateTask;
import com.afforess.assembly.util.NationCache;
import com.afforess.assembly.util.RegionCache;
import com.limewoodMedia.nsapi.NationStates;
import com.mchange.v2.c3p0.ComboPooledDataSource;

import controllers.DatabaseController;
import controllers.FirebaseAuthenticator;
import controllers.NationStatesController;
import play.*;
import play.libs.Akka;
import scala.concurrent.duration.Duration;

public class Global extends GlobalSettings {
	private ComboPooledDataSource pool;
	private NationCache cache;
	private RegionCache regionCache;
	private FirebaseAuthenticator firebase;
	private NationStates api;

	@Override
	public void onStart(Application app) {
		YamlConfiguration config = new YamlConfiguration(new File("./config.yml"));
		try {
			config.load();
		} catch (ConfigurationException e1) {
			Logger.error("Unable to parse configuration", e1);
			throw new RuntimeException(e1);
		}
		ConfigurationNode settings = config.getChild("settings");
		Logger.info("Application has started");
		try {
			Logger.info("Initializing database connection pool to [ " + settings.getChild("jbdc").getString() + " ]");
			Class.forName("com.mysql.jdbc.Driver");
			pool = new ComboPooledDataSource();
			pool.setDriverClass("com.mysql.jdbc.Driver");
			pool.setJdbcUrl(settings.getChild("jbdc").getString());
			pool.setMaxPoolSize(50);
			pool.setMinPoolSize(1);
			pool.setMaxIdleTime(600);
			pool.setMaxConnectionAge(60 * 60);
			pool.setDebugUnreturnedConnectionStackTraces(true);
			pool.setUnreturnedConnectionTimeout(300);
			pool.setAcquireRetryAttempts(60);
			pool.setIdleConnectionTestPeriod(60);
			pool.setMaxStatementsPerConnection(25);
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
		api = new NationStates();
		api.setRateLimit(48);
		api.setUserAgent(settings.getChild("User-Agent").getString());
		api.setRelaxed(true);
		this.cache = new NationCache(pool);
		this.regionCache = new RegionCache(pool);

		//Setup firebase
		ConfigurationNode firebaseConfig = config.getChild("firebase");
		firebase = new FirebaseAuthenticator(pool, cache, regionCache, firebaseConfig.getChild("token").getString(), api);
			
		//Setup region monitoring
		RegionMonitoring monitoring = new RegionMonitoring(api, pool);

		//Setup daily dumps
		File dumpsDir = new File(settings.getChild("dailydumps").getString());
		DailyDumps dumps = new DailyDumps(pool, dumpsDir, settings.getChild("User-Agent").getString());
		Thread dailyDumps = new Thread(dumps);
		dailyDumps.setDaemon(true);
		dailyDumps.start();

		HappeningsTask happenings = new HappeningsTask(pool, cache, api);
		Akka.system().scheduler().schedule(Duration.create(60, TimeUnit.SECONDS), Duration.create(2, TimeUnit.SECONDS), happenings, Akka.system().dispatcher());
		Akka.system().scheduler().schedule(Duration.create(120, TimeUnit.SECONDS), Duration.create(31, TimeUnit.SECONDS), new UpdateTask(api, pool, cache, happenings), Akka.system().dispatcher());
		Akka.system().scheduler().schedule(Duration.create(60, TimeUnit.SECONDS), Duration.create(60, TimeUnit.SECONDS), monitoring, Akka.system().dispatcher());
	}

	@Override
	public void onStop(Application app) {
		Logger.info("Application shutdown");
		pool.close();
	}

	@SuppressWarnings("unchecked")
	@Override
	public <A> A getControllerInstance(Class<A> controllerClass) throws Exception {
		if (FirebaseAuthenticator.class.isAssignableFrom(controllerClass)) {
			return (A) firebase;
		} else if (NationStatesController.class.isAssignableFrom(controllerClass)) {
			Constructor<A> cons = controllerClass.getConstructor(new Class[] {ComboPooledDataSource.class, NationCache.class, RegionCache.class, NationStates.class});
			return cons.newInstance(pool, cache, regionCache, api);
		} else if (DatabaseController.class.isAssignableFrom(controllerClass)) {
			Constructor<A> cons = controllerClass.getConstructor(new Class[] {ComboPooledDataSource.class, NationCache.class, RegionCache.class});
			return cons.newInstance(pool, cache, regionCache);
		}
		return super.getControllerInstance(controllerClass);
	}
}