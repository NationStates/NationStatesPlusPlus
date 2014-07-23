package net.nationstatesplusplus.assembly.model;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import net.nationstatesplusplus.assembly.util.Utils;

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
	@JsonProperty
	private long lastLogin;
	@JsonProperty
	private Region region;

	public Nation() {
		
	}

	public Nation(String name, String title, String fullName, String flag, int id, boolean waMember, boolean alive, long lastLogin) {
		this.name = name;
		this.title = title;
		this.fullName = fullName;
		this.flag = flag;
		this.id = id;
		this.waMember = waMember;
		this.alive = alive;
		this.lastLogin = lastLogin;
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
	
	public long getLastLogin() {
		return lastLogin;
	}

	public void setLastLogin(long last) {
		this.lastLogin = last;
	}

	public Region getRegion() {
		return region;
	}

	public void setRegion(Region region) {
		this.region = region;
	}

	public static Nation getNationById(Connection conn, int id, boolean includeRegion) throws SQLException {
		try (PreparedStatement select = conn.prepareStatement("SELECT id, name, title, full_name, wa_member, flag, alive, last_login, region FROM assembly.nation WHERE id = ?")) {
			select.setInt(1, id);
			return buildNation(conn, select, includeRegion);
		}
	}

	private static Nation buildNation(Connection conn, PreparedStatement select, boolean includeRegion) throws SQLException {
		try (ResultSet result = select.executeQuery()) {
			if (result.next()) {
				Nation nation = new Nation(result.getString("name"), result.getString("title"), result.getString("full_name"), result.getString("flag"),  result.getInt("id"), result.getByte("wa_member") == 1, result.getByte("alive") == 1, result.getLong("last_login"));
				if (includeRegion) {
					try (PreparedStatement region = conn.prepareStatement("SELECT name, flag, title FROM assembly.region WHERE id = ?")) {
						region.setInt(1, result.getInt("region"));
						try (ResultSet set = region.executeQuery()) {
							if (set.next()) {
								nation.setRegion(new Region(set.getString("name"), set.getString("title"), set.getString("flag")));
							}
						}
					}
				}
				return nation;
			}
		}
		return null;
	}

	public static Nation getNationByName(Connection conn, String name, boolean includeRegion) throws SQLException {
		try (PreparedStatement select = conn.prepareStatement("SELECT id, name, title, full_name, wa_member, flag, alive, last_login, region FROM assembly.nation WHERE name = ?")) {
			select.setString(1, Utils.sanitizeName(name));
			return buildNation(conn, select, includeRegion);
		}
	}
}
