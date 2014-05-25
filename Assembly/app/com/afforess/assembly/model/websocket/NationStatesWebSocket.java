package com.afforess.assembly.model.websocket;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;
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

	public NationContext getContext() {
		return new NationContext(nation, nationId, settings, activePage, access);
	}

	@Override
	public void onReady(WebSocket.In<JsonNode> in, WebSocket.Out<JsonNode> out) {
		try {
			this.out = out;
			writeInitialData(out);
			in.onMessage(new NationStatesCallback(out));
			access.getWebsocketManager().register(this, in);
		} catch (SQLException | ExecutionException e) {
			Logger.error("Exception while setting up websocket", e);
		}
	}

	private void writeInitialData(WebSocket.Out<JsonNode> out) throws SQLException, ExecutionException {
		Connection conn = null;
		try {
			conn = access.getPool().getConnection();
			for (RequestType type : getPageType().getInitialRequests()) {
				final NationContext context = getContext();
				writeRequest(out, type, context, null, conn);
			}
		} finally {
			DbUtils.closeQuietly(conn);
		}
	}

	/**
	 * Writes out the request to the given websocket, given a db connection, context and (optional) data request. Returns true if any data was written.
	 * 
	 * @param out
	 * @param type
	 * @param context
	 * @param request
	 * @param conn
	 * @return true if any data was written.
	 * @throws SQLException
	 * @throws ExecutionException
	 */
	private static boolean writeRequest(WebSocket.Out<JsonNode> out, RequestType type, NationContext context, DataRequest request, Connection conn) throws SQLException, ExecutionException {
		if (type.shouldSendData(conn, context)) {
			List<JsonNode> nodes = type.executeRequest(conn, request, context);
			for (int i = 0; i < nodes.size(); i++) {
				out.write(nodes.get(i));
			}
			return true;
		}
		return false;
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
					final NationContext context = getContext();
					writeRequest(out, type, context, request, conn);
					activePage.onRequest(type, request);
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
