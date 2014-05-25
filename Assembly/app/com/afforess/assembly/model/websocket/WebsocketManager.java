package com.afforess.assembly.model.websocket;

import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import play.libs.F.Callback0;
import play.mvc.WebSocket;

import com.fasterxml.jackson.databind.JsonNode;

public class WebsocketManager {
	private final ConcurrentHashMap<Integer, Set<NationStatesWebSocket>> websockets = new ConcurrentHashMap<Integer, Set<NationStatesWebSocket>>();
	private final ConcurrentHashMap<PageType, Set<NationStatesWebSocket>> pages = new ConcurrentHashMap<PageType, Set<NationStatesWebSocket>>();

	public WebsocketManager() {
		for (PageType page : PageType.values()) {
			pages.put(page, new HashSet<NationStatesWebSocket>());
		}
	}

	protected void register(NationStatesWebSocket socket, WebSocket.In<JsonNode> in) {
		if (socket.getNationId() > -1) {
			Set<NationStatesWebSocket> sockets = websockets.get(socket.getNationId());
			if (sockets == null) {
				sockets = new HashSet<NationStatesWebSocket>();
				Set<NationStatesWebSocket> set = websockets.putIfAbsent(socket.getNationId(), sockets);
				if (set != null)
					sockets = set;
			}
			synchronized(sockets) {
				sockets.add(socket);
				in.onClose(new UnregisterCallback(socket.getNationId(), socket));
			}
			Set<NationStatesWebSocket> set = pages.get(socket.getPageType());
			synchronized(set) {
				set.add(socket);
			}
		}
	}

	/*
	public void write(int nationId, PageType page, JsonNode node) {
		Set<NationStatesWebSocket> sockets = websockets.get(nationId);
		if (sockets != null) {
			synchronized(sockets) {
				for (NationStatesWebSocket socket : sockets) {
					if (socket.getPageType() == page) {
						socket.write(node);
					}
				}
			}
		}
	}
	 */

	public void onUpdate(PageType page, RequestType type, DataRequest request, JsonNode node, RequestFilter ...filters) {
		//Update all pages
		if (page == PageType.DEFAULT) {
			for (PageType t : PageType.values()) {
				if (t != PageType.DEFAULT)
					onUpdate(t, type, request, node);
			}
		}
		Set<NationStatesWebSocket> set = pages.get(page);
		synchronized(set) {
			if (!set.isEmpty()) {
				for (NationStatesWebSocket socket : set) {
					if (isValidFilter(socket.getContext(), filters)) {
						if (socket.getPage().isValidUpdate(type, request)) {
							socket.write(type, node);
						}
					}
				}
			}
		}
	}

	private static boolean isValidFilter(NationContext context, RequestFilter ...filters) {
		if (filters != null) {
			for (int i = 0; i < filters.length; i++) {
				if (filters[i] != null) {
					if (!filters[i].isValidForRequest(context)) {
						return false;
					}
				}
			}
		}
		return true;
	}

	private class UnregisterCallback implements Callback0 {
		private final int nationId;
		private final NationStatesWebSocket socket;
		UnregisterCallback(int nationId, NationStatesWebSocket socket) {
			this.nationId = nationId;
			this.socket = socket;
		}

		@Override
		public void invoke() throws Throwable {
			Set<NationStatesWebSocket> sockets = websockets.get(nationId);
			synchronized(sockets) {
				sockets.remove(socket);
			}
			Set<NationStatesWebSocket> set = pages.get(socket.getPageType());
			synchronized(set) {
				set.remove(socket);
			}
		}
	}
}
