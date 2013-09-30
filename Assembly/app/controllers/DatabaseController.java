package controllers;

import java.sql.Connection;
import java.sql.SQLException;

import org.spout.cereal.config.yaml.YamlConfiguration;

import com.afforess.assembly.util.DatabaseAccess;
import com.mchange.v2.c3p0.ComboPooledDataSource;

import play.mvc.Controller;

public abstract class DatabaseController extends Controller{
	private final ComboPooledDataSource pool;
	private final DatabaseAccess access;
	private final YamlConfiguration config;
	public DatabaseController(DatabaseAccess access, YamlConfiguration config) {
		this.pool = access.getPool();
		this.access = access;
		this.config = config;
	}

	public final Connection getConnection() throws SQLException {
		return pool.getConnection();
	}

	public final DatabaseAccess getDatabase() {
		return access;
	}

	public YamlConfiguration getConfig() {
		return config;
	}
}
