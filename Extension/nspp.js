function getNSPPAPI() {
	var api = {};
	var iframe = document.getElementById("nspp_api_iframe");
	api._user = null;
	api._auth = null;
	if (typeof iframe === "undefined" || iframe === null) {
		iframe = document.createElement("iframe");
		iframe.id = "nspp_api_iframe";
		iframe.src = "http://nationstatesplusplus.com/api.html";
		iframe.style.display = "none";
		document.body.appendChild(iframe);
	}
	api.getUserDetails = function(callback) {
		if (this._user == null) {
			var api = this;
			var receiveMessage = function(event) {
				console.log("logging message received at website: " + event.data);
				console.log(event);
				if (event.data.user != null) {
					api._user = event.data.user;
					api._auth = event.data.auth;
					window.removeEventListener("message", receiveMessage);
					if (typeof callback != "undefined" && callback != null) {
						callback(api._user, api._auth);
					}
				}
			};
			window.addEventListener("message", receiveMessage, false);
			var checkIframe = function(api) {
				if (api._user == null) {
					console.log("Checking iframe");
					var iframe = document.getElementById('nspp_api_iframe');
					iframe.contentWindow.postMessage('identify_user','*');
					setTimeout(checkIframe, 100, api);
				}
			};
			checkIframe(this);
		} else if (typeof callback != "undefined" && callback != null) {
			callback(this._user, this._auth);   
		}
	};
	api.refreshUser = function() {
		this._user = null;
		this._auth = null;
		var iframe = document.getElementById("nspp_api_iframe");
		iframe.parentNode.removeChild(iframe);
		iframe = document.createElement("iframe");
		iframe.id = "nspp_api_iframe";
		iframe.src = "http://nationstatesplusplus.com/api.html";
		iframe.style.display = "none";
		document.body.appendChild(iframe);
		getUserDetails();
	}
	return api;
}