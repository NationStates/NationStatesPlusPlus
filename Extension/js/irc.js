(function() {
	if (getVisiblePage() == "region" && getUserNation() !== "") {
		$.get("https://nationstatesplusplus.net/nationstates/irc.json", function(data) {
			for (var i = 0; i < data.length; i++) {
				var region = data[i];
				if (region["region"] == getVisibleRegion()) {
					var settings = getSettings();
					var network = settings.getValue("irc_network_override", region["network"]);
					var nick = settings.getValue("irc_username_override", getUserNation().replaceAll("_", " ").toTitleCase().replaceAll(" ", "_"));
					var ircUrl = "https://kiwiirc.com/client/" + network;
					if (isDarkTheme()) {
						ircUrl += "/?theme=cli&nick=";
					} else {
						ircUrl += "/?theme=relaxed&nick=";
					}
					ircUrl += nick + "&" + region["channel"];
					$("<h2 style='display: inline-block; margin-bottom: 0;'>Regional IRC</h2>" + 
					"<div style='display: inline; margin-left: 10px;'>" +
					"<a class='irc-link' href='javascript:void(0)'>(Hide)</a></div>" + 
					"<iframe seamless='seamless' id='irc-frame' src='" + ircUrl + 
					"' style='border:2px solid; width:100%; height:500px;'></iframe><div class='hzln'></div>").insertBefore($("h2:contains('Today's World Census Report')"));
					var toggleIRC = function() {
						var irc = $("a.irc-link");
						if ($(irc).html() == "(Hide)") {
							$(irc).html("(Show)");
							$("#irc-frame").hide();
							getSettings(true).setValue("show_irc", false);
						} else {
							$(irc).html("(Hide)");
							$("#irc-frame").show();
							getSettings(true).setValue("show_irc", true);
						}
					}
					$("a.irc-link").on("click", toggleIRC);

					if (!getSettings().isEnabled("show_irc")) {
						toggleIRC();
					}
					break;
				}
			}
		});
	}
})();

