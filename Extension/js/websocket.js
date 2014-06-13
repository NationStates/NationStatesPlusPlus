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

	var onWebsocketMessage = function(event) {
		lastMessageReceived = Date.now();
		var json = JSON.parse(event.data);
		for (var k in json) {
			var r = json[k];
			if (r != null) {
				//Special handling for this
				if (k == "authenticate_rss") {
					handleAuthentication(r);
				} else {
					var event = jQuery.Event("websocket/" + k);
					if (typeof r == "string") {
						event.json = JSON.parse(r);
					}
					else {
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
		if (getVisiblePage() == "region") {
			ws = new WebSocket("wss://nationstatesplusplus.net/api/ws/region/?nation=" + getUserNation() + "&userRegion=" + getUserRegion() + "&region=" + getVisibleRegion() + "&reconnect=" + reconnect);
		} else if (getVisiblePage() == "nation") {
			ws = new WebSocket("wss://nationstatesplusplus.net/api/ws/nation/?nation=" + getUserNation() + "&userRegion=" + getUserRegion() + "&visibleNation=" + getVisibleNation() + "&reconnect=" + reconnect);
		} else {
			ws = new WebSocket("wss://nationstatesplusplus.net/api/ws/?nation=" + getUserNation() + "&userRegion=" + getUserRegion() + "&reconnect=" + reconnect);
		}
		ws.onmessage = onWebsocketMessage;
		ws.onopen = onWebsocketOpen;
		ws.onclose = onWebsocketClose;
		keepAliveAttempts = 0;
		lastMessageReceived = Date.now();
	}
	//Open websocket
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
		if (ws != null) {
			if (Date.now() > lastMessageReceived + delay) {
				ws.send(JSON.stringify({ name: "keep_alive", data : {} }));
				keepAliveAttempts += 1;
				console.log("Sending keep alive, attempts: " + keepAliveAttempts);
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

	$(window).on("websocket/request", function(event) {
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