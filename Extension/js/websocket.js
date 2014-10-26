(function() {
	var ws = null;
	var isAuthenticated = false;
	var isAuthPending = false;
	var authTries = 0;
	var pendingRequests = [];
	var openTries = 0;
	var lastMessageReceived = 0;
	var keepAliveAttempts = 0;
	var reconnect = false;
	var time = Date.now();

	var onWebsocketMessage = function(event) {
		lastMessageReceived = Date.now();
		try {
			var json = JSON.parse(event.data);
		} catch (err) {
			console.log("Error parsing json");
			console.log(event.data);
		}
		for (var k in json) {
			var r = json[k];
			if (r != null) {
				//Special handling for this
				if (k == "authenticate_rss") {
					handleAuthentication(r);
				} else {
					var event = jQuery.Event("websocket." + k);
					if (typeof r == "string") {
						event.json = JSON.parse(r);
					} else {
						event.json = r;
					}
					$(window).trigger(event);
				}
			}
		}
	};

	function handleAuthentication(json) {
		isAuthenticated = (json.result == "success");
		console.log("Websocket Authenticated: " + json.result);
		if (isAuthenticated) {
			isAuthPending = false;

			//Copy to new array
			var copyOfPendingRequests = [];
			for (var i = 0; i < pendingRequests.length; i++) {
				copyOfPendingRequests.push(pendingRequests[i]);
			}
			//Wipe old array
			pendingRequests = [];

			//Attempt to send requests
			for (var i = 0; i < copyOfPendingRequests.length; i++) {
				sendRequest(copyOfPendingRequests[i]);
			}
		} else if (authTries < 3) {
			authTries++
			console.log("Authentication failed, trying recalculation");
			getRSSPrivateKey(true, function(rssKey) {
				ws.send(JSON.stringify({ name: "authenticate_rss", data : { "rss-key": rssKey } }));
			});
		} else {
			console.log("Authentication failed, out of retries.");
		}
	}

	var onWebsocketOpen = function(event) {
		console.log("Websocket took " + (Date.now() - time) + "ms to open");
		//Copy to new array
		var copyOfPendingRequests = [];
		for (var i = 0; i < pendingRequests.length; i++) {
			copyOfPendingRequests.push(pendingRequests[i]);
		}
		//Wipe old array
		pendingRequests = [];
		//Reset state
		isAuthenticated = false;
		isAuthPending = false;
		openTries = 0;

		//Attempt to send requests (some may fail, and be re-queued pending authentication)
		for (var i = 0; i < copyOfPendingRequests.length; i++) {
			sendRequest(copyOfPendingRequests[i]);
		}

		//Performance, try fast authentication if possible
		if (!isAuthenticated && !isAuthPending) {
			var cachedRss = localStorage.getItem("rss-priv-key-" + getUserNation());
			if (cachedRss != null) {
				isAuthPending = true;
				ws.send(JSON.stringify({ name: "authenticate_rss", data : { "rss-key": cachedRss } }));
			}
		}
		console.log("Websocket opened");
		reconnect = true;
	};

	var onWebsocketClose = function(event) {
		ws = null;
		setTimeout(openWebsocket, ((1 + openTries) * (1 + openTries)) * 5000);
		console.log("Websocket closed, retrying connection in " + ((1 + openTries) * (1 + openTries)) * 5000 + " ms");
	}

	function openWebsocket() {
		openTries += 1;
		var protocol = "wss://";
		if (window.location.href.startsWith("http://")) {
			protocol = "ws://";
		}
		$.get("https://nationstatesplusplus.net/api/nation/title/?name=shadow_afforess", function(data) { 
			if (getVisiblePage() == "region") {
				ws = new WebSocket(protocol + "nationstatesplusplus.net/api/ws/region/?nation=" + getUserNation() + "&userRegion=" + getUserRegion() + "&region=" + getVisibleRegion() + "&reconnect=" + reconnect);
			} else if (getVisiblePage() == "nation" && $("p.error").length == 0) {
				ws = new WebSocket(protocol + "nationstatesplusplus.net/api/ws/nation/?nation=" + getUserNation() + "&userRegion=" + getUserRegion() + "&visibleNation=" + getVisibleNation() + "&reconnect=" + reconnect);
			} else if (getVisiblePage() == "blank" && typeof $.QueryString["recruitment"] != "undefined") {
				ws = new WebSocket(protocol + "nationstatesplusplus.net/api/ws/recruitmentAdmin/?nation=" + getUserNation() + "&userRegion=" + getUserRegion() + "&adminRegion=" + $.QueryString["recruitment"] + "&reconnect=" + reconnect);
			} else {
				ws = new WebSocket(protocol + "nationstatesplusplus.net/api/ws/?nation=" + getUserNation() + "&userRegion=" + getUserRegion() + "&reconnect=" + reconnect);
			}
			ws.onmessage = onWebsocketMessage;
			ws.onopen = onWebsocketOpen;
			ws.onclose = onWebsocketClose;
			keepAliveAttempts = 0;
			lastMessageReceived = Date.now();
		});
	}
	//Open websocket
	console.log("User region: " + getUserRegion());
	console.log("User nation: " + getUserNation());
	if (getUserRegion() != "" && getUserNation() != "") {
		openWebsocket();
	}

	function sendRequest(request) {
		if (!request.requiresAuth || isAuthenticated) {
			lastMessageSent = Date.now(); 
			ws.send(JSON.stringify(request.json));
			return true;
		} else if (!isAuthPending) {
			console.log("Request requires authentication...");
			isAuthPending = true;
			getRSSPrivateKey(false, function(rssKey) {
				lastMessageSent = Date.now(); 
				ws.send(JSON.stringify({ name: "authenticate_rss", data : { "rss-key": rssKey } }));
			});
		}
		pendingRequests.push(request);
		return false;
	}

	function keepAlive() {
		var delay = isPageActive() ? 600000 : 30000; // 10 min or 30 s
		delay += keepAliveAttempts * 5000;
		if (ws != null && ws.readyState === 1) {
			if (Date.now() > lastMessageReceived + delay) {
				ws.send(JSON.stringify({ name: "keep_alive", data : {} }));
				keepAliveAttempts += 1;
				//console.log("Sending keep alive, attempts: " + keepAliveAttempts);
			} else {
				keepAliveAttempts = 0;
			}
			
			if (keepAliveAttempts > 5) {
				console.log("Closing websocket due to failed keep alives");
				ws.onclose = function() { }; // clear handler
				ws.close();
				onWebsocketClose();
			}
		}
	}
	setInterval(keepAlive, 1000);

	$(window).on("websocket.request", function(event) {
		if (ws == null || ws.readyState == 0) {
			var request = { };
			request.requiresAuth = event.requiresAuth;
			request.json = event.json;
			
			pendingRequests.push(request);
		}
		else {
			sendRequest(event);
		}
	});
})();

function sendWebsocketEvent() {
	if (arguments.length > 1) {
		var event = jQuery.Event("websocket.request");
		event.json = { name: arguments[0], data : arguments[1] };
		if (arguments.length > 2) {
			event.requiresAuth = arguments[2];
		}
		$(window).trigger(event);
		return true;
	}
	return false;
}

function UserSettings() {
	this.user = getUserNation();
	this.path = "";
	this.callbacks = [];
	if (arguments.length > 0) {
		this.user = arguments[0];
	}
	if (arguments.length > 1) {
		this.path = arguments[1];
	}
	this.child = function() {
		if (arguments.length > 0) {
			if (this.path.length > 0) {
				return new UserSettings(this.user, this.path + "." + arguments[0]);
			}
			return new UserSettings(this.user, arguments[0]);
		}
		return this;
	}

	/**
	* Sets the value of the setting with the value passed in. This will trigger any callbacks that are listening to this setting with the new value.
	*	@value to set for this setting
	*/
	this.set = function() {
		if (getUserNation() == this.user) {
			if (arguments.length > 0) {
				var setting = {setting: this.path, value: {}};
				setting.value[this.path] = arguments[0];
				sendWebsocketEvent("set_setting", setting, true);
				return true;
			}
		}
		return false;
	}

	/**
	* Removes all callbacks from this settings handler
	*/
	this.off = function() {
		for (var i = 0; i < this.callbacks.length; i += 1) {
			$(window).off("websocket.get_setting", this.callbacks[i]);
		}
		this.callbacks = [];
	}

	/**
	* Listens to changes in the setting value. The websocket immediately requests the state of the setting value from the server
	* unless sendImmediateRequest is false. The callback will be fired as soon as the websocket has a response, or whenever the setting changes.
	* 	@callback to send data to when the setting value changes
	* 	@defaultValue to use if the setting has no value
	* 	@sendImmediateRequest whether the state of the value should be requested immediately (defaults to true)
	*/
	this.on = function() {
		if (arguments.length > 0) {
			var callback = arguments[0];
			var defaultVal = (arguments.length > 1 ? arguments[1] : null);
			var sendImmediateRequest = (arguments.length > 2 ? arguments[2] : true);
			var primaryNode = this.path.split(".")[0];
			var eventCallback = function(event) {
				if (event.json.hasOwnProperty(primaryNode)) {
					if (defaultVal != null && event.json[primaryNode] == null) {
						event.json[primaryNode] = defaultVal;
					}
					callback(event.json);
				}
			};
			this.callbacks.push(eventCallback);
			$(window).on("websocket.get_setting", eventCallback);
			if (sendImmediateRequest) {
				sendWebsocketEvent("get_setting", {user: this.user, setting: this.path });
			}
			return true;
		}
		return false;
	};

	/**
	* Queries the current setting value once and returns the value to the callback. The websocket immediately requests the state of the setting value from the server. 
	* The callback will be fired as soon as the websocket has a response. After the initial response, the callback is removed.
	* 	@callback to send data to when the setting value changes
	* 	@defaultValue to use if the setting has no value
	*/
	this.once = function() {
		if (arguments.length > 0) {
			var callback = arguments[0];
			var primaryNode = this.path.split(".")[0];
			var defaultVal = (arguments.length > 1 ? arguments[1] : null);
			var eventCallback = function(event) {
				if (event.json.hasOwnProperty(primaryNode)) {
					if (defaultVal != null && event.json[primaryNode] == null) {
						event.json[primaryNode] = defaultVal;
					}
					callback(event.json);
					$(window).off("websocket.get_setting", eventCallback);
				}
			};
			$(window).on("websocket.get_setting", eventCallback);
			sendWebsocketEvent("get_setting", {user: this.user, setting: this.path });
			return true;
		}
		return false;
	};
}