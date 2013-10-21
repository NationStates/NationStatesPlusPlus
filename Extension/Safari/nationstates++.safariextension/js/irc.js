(function() {
	var ircEnabledRegions = [
		{region: "capitalist_paradise", network: "irc.esper.net", channel: "#capitalistparadise"},
		{region: "the_north_pacific", network: "irc.esper.net", channel: "#tnp"},
		{region: "the_south_pacific", network: "irc.esper.net", channel: "#the_south_pacific"},
		{region: "the_west_pacific", network: "irc.esper.net", channel: "#thewestpacific"},
		{region: "the_pacific", network: "irc.coldfront.net", channel: "#the_pacific"},
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
		{region: "unknown", network: "irc.esper.net", channel: "#incognita"},
		{region: "new_warsaw_pact", network: "irc.esper.net", channel: "#NWP"},
		{region: "new_odessa", network: "irc.uk.mibbit.net", channel: "#NewOdessa"},
		{region: "panessos", network: "irc.esper.net", channel: "#Panessos"},
		{region: "the_grand_northern_imperium", network: "irc.esper.net", channel: "#GNI"},
		{region: "the_royal_alliance", network: "irc.uk.mibbit.net", channel: "#TheRoyalAlliance"},
		{region: "the_commonwealth_of_kings", network: "irc.esper.net", channel: "#CoK"},
		{region: "confederation_of_nations", network: "irc.esper.net", channel: "#Confederation_of_Nations"},
		{region: "inceptum", network: "irc.esper.net", channel: "#Inceptum"},
		{region: "versutian_federation", network: "irc.esper.net", channel: "#Versutian"}

	];
	if (getVisiblePage() == "region" && getUserNation() !== "") {
		for (var i = 0; i < ircEnabledRegions.length; i++) {
			var region = ircEnabledRegions[i];
			if (region["region"] == getVisibleRegion()) {
				var networkOverride = localStorage.getItem("irc_network_override");
				var nickOverride = localStorage.getItem("irc_username_override");
				var ircUrl = "https://kiwiirc.com/client/" + (networkOverride == null ? region["network"] : networkOverride);
				if (document.head.innerHTML.indexOf("ns.dark") != -1) {
					ircUrl += "/?theme=cli&nick=";
				} else {
					ircUrl += "/?theme=relaxed&nick=";
				}
				ircUrl += (nickOverride == null ? getUserNation().replaceAll("_", " ").toTitleCase().replaceAll(" ", "_") : nickOverride) + "&" + region["channel"];
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
						localStorage.setItem("show_irc", false);
					} else {
						$(irc).html("(Hide)");
						$("#irc-frame").show();
						localStorage.setItem("show_irc", true);
					}
				}
				$("a.irc-link").on("click", toggleIRC);

				if (localStorage.getItem("show_irc") == "false") {
					toggleIRC();
				}
				break;
			}
		}
	}
})();

