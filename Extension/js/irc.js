(function() {
	if (getVisiblePage() == "region" && getUserNation() !== "") {
		$.get("https://nationstatesplusplus.net/nationstates/irc.json", function(data) {
			for (var i = 0; i < data.length; i++) {
				var region = data[i];
				if (region["region"] == getVisibleRegion()) {
					$("<div id='region-irc'></div><div class='hzln'></div>").insertBefore($("h2:contains('Today's World Census Report')"));
					$("#region-irc").append("<h2 style='display: inline-block; margin-bottom: 0;'>Regional IRC</h2>");
					$("#region-irc").append("<div style='display: inline; margin-left: 10px;'><a class='irc-link' href='javascript:void(0)'>(Show)</a></div>");
					
					function hideIRC(update) {
						$("a.irc-link").html("(Show)");
						$("#irc-frame").remove();
						if (update)
							(new UserSettings()).child("show_irc").set(false);
					}
					
					function showIRC(update) {
						$("a.irc-link").html("(Hide)");
						var ircURL = "https://kiwiirc.com/client/" + $("#region-irc").data("network");
						if (isDarkTheme()) {
							ircURL += "/?theme=cli&nick=";
						} else {
							ircURL += "/?theme=relaxed&nick=";
						}
						ircURL += $("#region-irc").data("user") + "&" + $("#region-irc").data("channel")
						$("#region-irc").append("<iframe seamless='seamless' id='irc-frame' style='border:2px solid; width:100%; height:500px;' src='" + ircURL + "'></iframe>");
						if (update)
							(new UserSettings()).child("show_irc").set(true);
					}

					var toggleIRC = function() {
						if ($("a.irc-link").html() == "(Hide)") {
							hideIRC(true);
						} else {
							showIRC(true);
						}
					}

					$("#region-irc").data("channel", region["channel"]);
					$("#region-irc").data("network", region["network"]);
					$("#region-irc").data("user", getUserNation().replaceAll("_", " ").toTitleCase().replaceAll(" ", "_"));
					(new UserSettings()).child("irc_network_override").on(function(data) {
						if (data["irc_network_override"] != null && data["irc_network_override"].length > 0) {
							$("#region-irc").data("network", data["irc_network_override"]);
						}
					});
					(new UserSettings()).child("irc_username_override").on(function(data) {
						if (data["irc_username_override"] != null && data["irc_username_override"].length > 0) {
							$("#region-irc").data("user", data["irc_username_override"]);
						}
					});
					(new UserSettings()).child("show_irc").on(function(data) {
						if (data["show_irc"] != null && data["show_irc"]) {
							if ($("#irc-frame").length == 0) {
								showIRC(false);
							}
						} else {
							hideIRC(false);
						}
					});
					$("a.irc-link").on("click", toggleIRC);

					break;
				}
			}
		});
	}
})();

