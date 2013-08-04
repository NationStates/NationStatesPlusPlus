(function() {
	var ircEnabledRegions = [
		{region: "capitalist_paradise", network: "irc.esper.net", channel: "#capitalistparadise"},
		{region: "the_north_pacific", network: "irc.esper.net", channel: "#tnp"},
		{region: "the_south_pacific", network: "irc.esper.net", channel: "#the_south_pacific"},
		{region: "the_west_pacific", network: "irc.esper.net", channel: "#thewestpacific"},
		{region: "the_pacific", network: "irc.esper.net", channel: "#the_pacific"},
		{region: "the_east_pacific", network: "irc.esper.net", channel: "#theeastpacific"},
		{region: "lazarus", network: "irc.esper.net", channel: "#lazarus"},
		{region: "balder", network: "irc.esper.net", channel: "#balder"},
		{region: "siris", network: "irc.esper.net", channel: "#siris"},
		{region: "british_isles", network: "irc.esper.net", channel: "#british-isles"},
		{region: "the_brotherhood_of_malice", network: "irc.esper.net", channel: "#brotherhood_of_malice"},
		{region: "equilism", network: "irc.esper.net", channel: "#equilism"},
		{region: "europeia", network: "irc.esper.net", channel: "#Euro"},
		{region: "maredoratica", network: "irc.esper.net", channel: "#maredoratica"},
		{region: "esquarium", network: "irc.esper.net", channel: "#Esquarium"},
		{region: "minyang", network: "irc.esper.net", channel: "#Minyang"},
		{region: "mordor", network: "irc.esper.net", channel: "#Mordor"},
		{region: "nasicournia", network: "irc.esper.net", channel: "#Nasicournia"},
		{region: "osiris", network: "irc.esper.net", channel: "#osiris"},
		{region: "sondria", network: "irc.esper.net", channel: "#sondria"},
		{region: "spiritus", network: "irc.esper.net", channel: "#Spiritus"},
		{region: "pardes", network: "irc.esper.net", channel: "#Pardes_Elion"},
		{region: "taijitu", network: "irc.esper.net", channel: "#Taijitu"},
		{region: "the_black_hawks", network: "irc.esper.net", channel: "#tbh"},
		{region: "the_south", network: "irc.esper.net", channel: "#The_South"},
		{region: "unknown", network: "irc.esper.net", channel: "#incognita"}
	];
	if (getVisiblePage() == "region" && getUserNation() != "") {
		for (var i = 0; i < ircEnabledRegions.length; i++) {
			var region = ircEnabledRegions[i];
			if (region["region"] == getVisibleRegion()) {
				var ircUrl = "http://direct.capitalistparadise.com/kiwi/" + region["network"];
				if (document.head.innerHTML.indexOf("ns.dark") != -1) {
					ircUrl += "/?theme=cli&nick=";
				} else {
					ircUrl += "/?theme=relaxed&nick=";
				}
				ircUrl += getUserNation().split("_").join(" ").toTitleCase() + "&" + region["channel"];
				$("<h2 style='display: inline-block; margin-bottom: 0;'>Regional IRC</h2>" + 
				"<div style='display: inline; margin-left: 10px;'>" +
				"<a id='irc-link' href='javascript:void(0)' onclick=toggleIRC(this)>(Hide)</a></div>" + 
				"<iframe seamless='seamless' id='irc-frame' src='" + ircUrl + 
				"' style='border:2px solid; width:100%; height:500px;'></iframe><div class='hzln'></div>").insertBefore("h2");
				if (localStorage.getItem("show_irc") == "false") {
					toggleIRC($("#irc-link"));
				}
				var contentWindow = $("#irc-frame")[0].contentWindow;
				setTimeout(function() {
					console.log("IRC Autologin: " + isSettingEnabled("autologin_to_regional_irc"));
					if (isSettingEnabled("autologin_to_regional_irc")) {
						contentWindow.postMessage({ method: "login"}, "*");
						console.log("Attempting irc autologin");
					}
				}, 2500);
				window.onbeforeunload = function(event) {
					console.log("Logging off IRC: "  + contentWindow);
					contentWindow.postMessage({ method: "logout"}, "*");
				}
				break;
			}
		}
	}
})();

function toggleIRC(irc) {
	if ($(irc).html() == "(Hide)") {
		$(irc).html("(Show)");
		$("#irc-frame").hide();
		localStorage.setItem("show_irc", false);
	} else {
		$(irc).html("(Hide)");
		$("#irc-frame").show();
		localStorage.setItem("show_irc", true);
	}
}