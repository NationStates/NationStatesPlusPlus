package com.afforess.assembly.model.websocket;

public interface RequestFilter {

	public boolean isValidForRequest(NationContext context);

}
