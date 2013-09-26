package controllers;

import java.sql.Connection;
import java.sql.SQLException;

import com.afforess.assembly.util.DatabaseAccess;
import com.mchange.v2.c3p0.ComboPooledDataSource;

import play.mvc.Controller;

public abstract class DatabaseController extends Controller{
	private final ComboPooledDataSource pool;
	private final DatabaseAccess access;
	public DatabaseController(DatabaseAccess access) {
		this.pool = access.getPool();
		this.access = access;
	}

	public final Connection getConnection() throws SQLException {
		return pool.getConnection();
	}

	public final DatabaseAccess getDatabase() {
		return access;
	}
}
