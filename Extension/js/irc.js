(function() {
	if (getVisiblePage() == "region" && getUserNation() !== "") {
		$.get("https://nationstatesplusplus.net/nationstates/irc.json", function(data) {
			for (var i = 0; i < data.length; i++) {
				var region = data[i];
				if (region["region"] == getVisibleRegion()) {
					$("<div id='region-irc'></div><div class='hzln'></div>").insertBefore($("h2:contains('Today's World Census Report')"));
					$("#region-irc").append("<h2 style='display: inline-block; margin-bottom: 0;'>Regional IRC</h2>");
					$("#region-irc").append("<div style='display: inline; margin-left: 10px;'><a class='irc-link' href='javascript:void(0)'>(Show)</a></div>");

					var toggleIRC = function() {
						var irc = $("a.irc-link");
						console.log("IRC: " + irc.html());
						if (irc.html() == "(Hide)") {
							irc.html("(Show)");
							$("#irc-frame").hide();
							getSettings(true).setValue("show_irc", false);
						} else {
							irc.html("(Hide)");
							if ($("#irc-frame").length == 0) {
								$("#region-irc").append("<iframe seamless='seamless' id='irc-frame' style='border:2px solid; width:100%; height:500px;' src='" + $("#region-irc").data("irc") + "'></iframe>");
							}
							$("#irc-frame").show();
							getSettings(true).setValue("show_irc", true);
						}
					}

					function generateIRCURL(region) {
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
						return ircUrl;
					}

					$("#region-irc").data("irc", generateIRCURL(region));
					$("a.irc-link").on("click", toggleIRC);
	
					if (getSettings().isEnabled("show_irc")) {
						toggleIRC();
					}

					break;
				}
			}
		});
	}
})();

