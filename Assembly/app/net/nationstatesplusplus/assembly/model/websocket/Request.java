package net.nationstatesplusplus.assembly.model.websocket;

import java.sql.Connection;
import java.sql.SQLException;

import com.fasterxml.jackson.databind.JsonNode;

public interface Request {
	public JsonNode[] executeRequest(Connection conn, DataRequest request, NationContext context) throws SQLException;
}
