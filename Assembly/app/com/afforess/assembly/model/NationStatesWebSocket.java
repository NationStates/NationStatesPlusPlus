package com.afforess.assembly.model;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.apache.commons.dbutils.DbUtils;

import com.afforess.assembly.util.DatabaseAccess;
import com.afforess.assembly.util.Utils;
import com.fasterxml.jackson.databind.JsonNode;

import controllers.NewspaperController;
import controllers.RegionController;
import play.Logger;
import play.libs.Json;
import play.mvc.WebSocket;

public class NationStatesWebSocket extends WebSocket<JsonNode>{
	private final DatabaseAccess access;
	private NationStatesPage activePage;
	private String nation;
	private int nationId;
	private String region;
	private int regionId;
	private NationSettings settings;
	public NationStatesWebSocket(DatabaseAccess access, NationStatesPage page, String nation, String region) {
		this.access = access;
		this.activePage = page;
		this.nation = nation;
		this.region = region;
		try {
			this.nationId = access.getNationIdCache().get(Utils.sanitizeName(this.nation));
			this.regionId = access.getRegionIdCache().get(Utils.sanitizeName(this.region));
			if (nationId > -1) {
				settings = NationSettings.parse(access.getNationSettingsCache().get(nationId));
			} else {
				settings = new NationSettings();
			}
		} catch (ExecutionException e) {
			Logger.error("Unable to lookup nation and region id", e);
		}
	}

	@Override
	public void onReady(WebSocket.In<JsonNode> in,	WebSocket.Out<JsonNode> out) {
		try {
			writeInitialData(out);
		} catch (SQLException e) {
			Logger.error("SQLException", e);
		}
	}

	private void writeInitialData(WebSocket.Out<JsonNode> out) throws SQLException {
		Connection conn = null;
		try {
			conn = access.getPool().getConnection();
			if (activePage == NationStatesPage.REGION) {
				out.write(wrapJson("region_titles", RegionController.getRegionalTitles(conn, region)));
				out.write(wrapJson("region_map", RegionController.getRegionalMap(conn, region)));
				out.write(wrapJson("region_updates", RegionController.getUpdateTime(conn, regionId, 2)));
				out.write(wrapJson("region_newspaper", NewspaperController.getNewspaper(conn, region)));
				if (settings.getValue("embassy_flags", true, Boolean.class)) {
					
				}
			}
		} finally {
			DbUtils.closeQuietly(conn);
		}
	}

	private static JsonNode wrapJson(String name, JsonNode node) {
		Map<String, JsonNode> json = new HashMap<String, JsonNode>(1);
		json.put(name, node);
		return Json.toJson(json);
	}
}
