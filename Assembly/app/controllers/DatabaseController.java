package controllers;

import java.sql.Connection;
import java.sql.SQLException;

import com.afforess.assembly.util.NationCache;
import com.afforess.assembly.util.RegionCache;
import com.mchange.v2.c3p0.ComboPooledDataSource;

import play.mvc.Controller;

public abstract class DatabaseController extends Controller{
	private final ComboPooledDataSource pool;
	private final NationCache cache;
	private final RegionCache regionCache;
	public DatabaseController(ComboPooledDataSource pool, NationCache cache, RegionCache regionCache) {
		this.pool = pool;
		this.cache = cache;
		this.regionCache = regionCache;
	}

	public final Connection getConnection() throws SQLException {
		return pool.getConnection();
	}

	public final NationCache getCache() {
		return cache;
	}

	public final RegionCache getRegionCache() {
		return regionCache;
	}
}
