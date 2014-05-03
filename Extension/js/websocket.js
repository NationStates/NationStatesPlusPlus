(function() {
	var ws = null;
	if (getVisiblePage() == "region") {
		ws = new WebSocket("wss://nationstatesplusplus.net/api/ws/region/?nation=" + getUserNation() + "&region=" + getVisibleRegion());
	} else {
		return;
	}
	var time = Date.now();
	ws.onmessage = function(event) {
		var json = JSON.parse(event.data);
		for (var k in json) {
			var r = json[k];
			if (r != null) {
				var event = jQuery.Event("websocket/" + k);
				event.json = r;
				console.log(event);
				$(window).trigger(event);
			}
		}
	};
	var pendingRequests = [];
	ws.onopen = function(event) {
		for (var i = 0; i < pendingRequests.length; i++) {
			//console.log("send queued request: " + pendingRequests[i]);
			ws.send(pendingRequests[i]);
		}
		pendingRequests = [];
	};
	$(window).on("websocket/request", function(event) {
		if (ws.readyState == 0) {
			//console.log("queueing request: " + JSON.stringify(event.json));
			pendingRequests.push(JSON.stringify(event.json));
		}
		else {
			//console.log("sending request: " + JSON.stringify(event.json));
			ws.send(JSON.stringify(event.json));
		}
	});
})();