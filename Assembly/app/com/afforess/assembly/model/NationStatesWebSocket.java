package com.afforess.assembly.model;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.concurrent.ExecutionException;

import org.apache.commons.dbutils.DbUtils;

import com.afforess.assembly.model.page.NationStatesPage;
import com.afforess.assembly.util.DatabaseAccess;
import com.afforess.assembly.util.Utils;
import com.fasterxml.jackson.databind.JsonNode;

import play.Logger;
import play.libs.F.Callback;
import play.mvc.WebSocket;

public final class NationStatesWebSocket extends WebSocket<JsonNode>{
	private final DatabaseAccess access;
	private NationStatesPage activePage;
	private String nation;
	private int nationId;
	private NationSettings settings;
	private WebSocket.Out<JsonNode> out = null;
	public NationStatesWebSocket(DatabaseAccess access, NationStatesPage page, String nation) {
		this.access = access;
		this.activePage = page;
		this.nation = nation;
		try {
			this.nationId = access.getNationIdCache().get(Utils.sanitizeName(this.nation));
			if (nationId > -1) {
				settings = NationSettings.parse(access.getNationSettingsCache().get(nationId));
			} else {
				settings = new NationSettings();
			}
		} catch (ExecutionException e) {
			Logger.error("Unable to lookup nation id", e);
		}
	}

	public int getNationId() {
		return nationId;
	}

	public String getNation() {
		return nation;
	}

	public PageType getPageType() {
		return activePage.getType();
	}

	public NationStatesPage getPage() {
		return activePage;
	}

	public void write(RequestType type, JsonNode node) {
		if (out != null) {
			out.write(type.wrapJson(node));
		} else {
			throw new IllegalStateException("Attempted to write to an unopened websocket");
		}
	}

	@Override
	public void onReady(WebSocket.In<JsonNode> in, WebSocket.Out<JsonNode> out) {
		try {
			this.out = out;
			writeInitialData(out);
			in.onMessage(new NationStatesCallback(out));
			access.getWebsocketManager().register(this, in);
		} catch (SQLException e) {
			Logger.error("SQLException", e);
		}
	}

	private void writeInitialData(WebSocket.Out<JsonNode> out) throws SQLException {
		Connection conn = null;
		try {
			conn = access.getPool().getConnection();
			for (RequestType type : getPageType().getInitialRequests()) {
				if (type.shouldSendData(settings)) {
					out.write(type.executeRequest(conn, null, nation, nationId, activePage));
				}
			}
		} finally {
			DbUtils.closeQuietly(conn);
		}
	}

	private class NationStatesCallback implements Callback<JsonNode> {
		private final WebSocket.Out<JsonNode> out;
		NationStatesCallback(WebSocket.Out<JsonNode> out) {
			this.out = out;
		}

		@Override
		public void invoke(JsonNode node) throws Throwable {
			DataRequest request = DataRequest.parse(node);
			RequestType type = RequestType.getTypeForName(request.getName());
			if (type != null) {
				Connection conn = null;
				try {
					conn = access.getPool().getConnection();
					if (type.shouldSendData(settings)) {
						out.write(type.executeRequest(conn, request, nation, nationId, activePage));
						activePage.onRequest(type, request);
					}
				} catch (Exception e) {
					Logger.error("Exception while sending websocket data", e);
				} finally {
					DbUtils.closeQuietly(conn);
				}
			} else {
				Logger.warn("Unknown request type: " + request.getName());
			}
		}
	}
}
