package com.afforess.assembly.model;

import java.sql.Connection;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import org.apache.commons.dbutils.DbUtils;

import com.afforess.assembly.util.Utils;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class Nation {
	@JsonProperty
	private String name;
	@JsonProperty
	private String title;
	@JsonProperty
	private String fullName;
	@JsonProperty
	private String flag;
	@JsonProperty
	private int id;
	@JsonProperty
	private boolean waMember;
	@JsonProperty
	private boolean alive;
	
	public Nation() {
		
	}

	public Nation(String name, String title, String fullName, String flag, int id, boolean waMember, boolean alive) {
		this.name = name;
		this.title = title;
		this.fullName = fullName;
		this.flag = flag;
		this.id = id;
		this.waMember = waMember;
		this.alive = alive;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getFullName() {
		return fullName;
	}

	public void setFullName(String fullName) {
		this.fullName = fullName;
	}

	public String getFlag() {
		return flag;
	}

	public void setFlag(String flag) {
		this.flag = flag;
	}

	public int getId() {
		return id;
	}

	public void setId(int id) {
		this.id = id;
	}

	public boolean isWaMember() {
		return waMember;
	}

	public void setWaMember(boolean waMember) {
		this.waMember = waMember;
	}

	public boolean isAlive() {
		return alive;
	}

	public void setAlive(boolean alive) {
		this.alive = alive;
	}

	public static Nation getNationById(Connection conn, int id) throws SQLException {
		PreparedStatement select = null;
		try {
			select = conn.prepareStatement("SELECT name, title, full_name, wa_member, flag, alive FROM assembly.nation WHERE id = ?");
			select.setInt(1, id);
			ResultSet result = select.executeQuery();
			if (result.next()) {
				return new Nation(result.getString(1), result.getString(2), result.getString(3), result.getString(5), id, result.getByte(4) == 1, result.getByte(6) == 1);
			}
			return null;
		} finally {
			DbUtils.closeQuietly(select);
		}
	}

	public static Nation getNationByName(Connection conn, String name) throws SQLException {
		PreparedStatement select = null;
		try {
			select = conn.prepareStatement("SELECT id, title, full_name, wa_member, flag, alive FROM assembly.nation WHERE name = ?");
			select.setString(1, Utils.sanitizeName(name));
			ResultSet result = select.executeQuery();
			if (result.next()) {
				return new Nation(Utils.sanitizeName(name), result.getString(2), result.getString(3), result.getString(5), result.getInt(1), result.getByte(4) == 1, result.getByte(6) == 1);
			}
			return null;
		} finally {
			DbUtils.closeQuietly(select);
		}
	}
}
