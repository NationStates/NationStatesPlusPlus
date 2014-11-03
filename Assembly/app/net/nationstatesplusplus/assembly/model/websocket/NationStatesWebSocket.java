package net.nationstatesplusplus.assembly.model.websocket;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.concurrent.ExecutionException;

import net.nationstatesplusplus.assembly.model.page.NationStatesPage;
import net.nationstatesplusplus.assembly.nation.DefaultSettings;
import net.nationstatesplusplus.assembly.nation.NationSettings;
import net.nationstatesplusplus.assembly.util.DatabaseAccess;

import com.fasterxml.jackson.databind.JsonNode;
import play.Logger;
import play.libs.F.Callback;
import play.mvc.WebSocket;

/**
 * Represents a websocket connection to a nation viewing a page on nationstates
 */
public final class NationStatesWebSocket extends WebSocket<JsonNode> {
	private final DatabaseAccess access;
	/**
	 * The active page the user is on
	 */
	private final NationStatesPage activePage;
	private final String nation;
	private final int nationId;
	private final String userRegion;
	private final int userRegionId;
	private final NationSettings settings;
	private WebSocket.Out<JsonNode> out = null;
	private boolean authenticated = false;
	private final boolean reconnect;
	private long lastPing = System.currentTimeMillis();

	public NationStatesWebSocket(DatabaseAccess access, NationStatesPage page, String nation, String userRegion, boolean reconnect) {
		this.access = access;
		this.activePage = page;
		this.nation = nation;
		this.userRegion = userRegion;
		this.nationId = access.getNationId(this.nation);
		this.userRegionId = access.getRegionId(this.userRegion);
		this.reconnect = reconnect;
		if (nationId > -1) {
			settings = access.getNationSettings(nation);
		} else {
			settings = new DefaultSettings();
		}
	}

	public int getNationId() {
		return nationId;
	}

	public String getNation() {
		return nation;
	}

	public int getUserRegionId() {
		return userRegionId;
	}

	public String getUserRegion() {
		return userRegion;
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

	private void pong() {
		lastPing = System.currentTimeMillis();
	}

	public long lastPing() {
		return lastPing;
	}

	public void close() {
		out.close();
	}

	public NationContext getContext() {
		return new NationContext(nation, nationId, userRegion, userRegionId, settings, activePage, access);
	}

	public boolean isAuthenticated() {
		return authenticated;
	}

	@Override
	public void onReady(WebSocket.In<JsonNode> in, WebSocket.Out<JsonNode> out) {
		try {
			this.out = out;
			// Only write out initial data for new connections, not reconnections
			if (!reconnect) {
				writeInitialData(out);
			}
			in.onMessage(new NationStatesCallback(this));
			access.getWebsocketManager().register(this, in);
		} catch (SQLException e) {
			Logger.error("Exception while setting up websocket", e);
		}
	}

	private void writeInitialData(WebSocket.Out<JsonNode> out) throws SQLException {
		try (Connection conn = access.getPool().getConnection()) {
			for (RequestType type : getPageType().getInitialRequests()) {
				final NationContext context = getContext();
				writeRequest(type, context, null, conn);
			}
		}
	}

	private static final long[] requestTimes = new long[RequestType.values().length];
	private static final long[] requestTotals = new long[RequestType.values().length];
	private static volatile long requestCount = 0;
	
	/**
	 * Writes out the request to the given websocket, given a db connection,
	 * context and (optional) data request. Returns true if any data was written.
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
	private boolean writeRequest(RequestType type, NationContext context, DataRequest request, Connection conn) throws SQLException {
		long start = System.currentTimeMillis();
		requestCount++;
		if (requestCount % 500 == 0) {
			Logger.info("Request timings...");
			for (int i = 0; i < RequestType.values().length; i++) {
				RequestType rt = RequestType.values()[i];
				Logger.info("Request Type: {} - Total Requests: {}, Total Time: {}, Average Time: {}", rt.name(), requestTotals[i], requestTimes[i], requestTimes[i] / (double)requestTotals[i]);
			}
		}
		try {
			if (type.shouldSendData(conn, context)) {
				if (authenticated || !type.requiresAuthentication()) {
					JsonNode[] nodes = type.executeRequest(conn, request, context);
					// TODO remove this horrible hack with real logic
					if (!authenticated && type == RequestType.AUTHENTICATE_RSS && nodes.length == 1) {
						authenticated = nodes[0].toString().contains("success");
						Logger.info("Authenticated websocket from " + nation);
					}
					for (int i = 0; i < nodes.length; i++) {
						out.write(nodes[i]);
					}
					return true;
				}
			}
			return false;
		} finally {
			requestTimes[type.ordinal()] += (System.currentTimeMillis() - start);
			requestTotals[type.ordinal()]++;
		}
	}

	private static class NationStatesCallback implements Callback<JsonNode> {
		private final NationStatesWebSocket parent;

		NationStatesCallback(NationStatesWebSocket parent) {
			this.parent = parent;
		}

		@Override
		public void invoke(JsonNode node) throws Throwable {
			DataRequest request = DataRequest.parse(node);
			RequestType type = RequestType.getTypeForName(request.getName());
			if (type != null) {
				parent.pong();
				try (Connection conn = parent.access.getPool().getConnection()) {
					final NationContext context = parent.getContext();
					parent.writeRequest(type, context, request, conn);
					parent.activePage.onRequest(type, request);
				} catch (Exception e) {
					Logger.error("Exception while sending websocket data", e);
				}
			} else {
				Logger.warn("Unknown request type: " + request.getName());
			}
		}
	}
}
