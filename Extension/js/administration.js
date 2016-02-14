(function() {
	if (getVisiblePage() == "region_control") {
		$("input[name='nation_name'], #rpassword").addClass("text-input");
		$("input[type='button']").addClass("button");

		var nsppIcon = "<span style='font-size:12px' title='This is a setting that is provided by the NationStates++ extension'>(NS<i class='fa fa-plus'></i><i class='fa fa-plus'></i>) </span>";
		
		//Found Newspaper button
		$("<div id='regional_newspaper'></div>").prependTo(":header:contains('Communications') + .divindent");
		$("#regional_newspaper").html("<h4>" + nsppIcon + "Regional Newspaper</h4>");
		$.get("https://nationstatesplusplus.net/api/newspaper/region/?region=" + getVisibleRegion() + "&time=" + Date.now(), function(data) {
			$("#regional_newspaper").append("<button id='disband_news' class='button danger'>Disband Regional Newspaper</button><span id='lack_authority' style='display:none;margin-left: 5px;color:red;'>You do not have authority to disband.</span><span id='disbanded_success' style='display:none;margin-left: 5px;color:green;'>The regional newspaper has been disbanded.</span>");
			$("#disband_news").on("click", function(event) {
				event.preventDefault();
				doAuthorizedPostRequest("https://nationstatesplusplus.net/api/newspaper/disband/?region=" + getVisibleRegion(), "", function(data) {
					$("#disband_news").toggleDisabled();
					$("#disbanded_success").show();
				}, function() {
					$("#lack_authority").show();
					$("#disband_news").toggleDisabled();
				});
			});
		}).fail(function() {
			$("#regional_newspaper").append("<button id='found_news' class='button'>Found Regional Newspaper</button><span id='lack_authority' style='display:none;margin-left: 5px;color:red;'>You do not have authority.</span>");
			$("#found_news").on("click", function(event) {
				event.preventDefault();
				doAuthorizedPostRequest("https://nationstatesplusplus.net/api/newspaper/found/?region=" + getVisibleRegion(), "", function(json) {
					window.location.href = "//www.nationstates.net/page=blank?manage_newspaper=" + json.newspaper_id;
				}, function() {
					$("#lack_authority").show();
					$("#found_news").toggleDisabled();
				});
			});
		});

		//Regional Titles
		$(".divindent:first").append("<div id='regional_titles'><h4>" + nsppIcon + "Regional Titles</h4><fieldset>" +
			"<p><span id='rd_label'><b>Regional Delegate Title: </b></span><input placeholder='Title for the WA Delegate' id='rd_title' style='width:500px' maxlength='40' class='text-input' type='text' disabled></p>" +
			"<p><span id='rf_label'><b>Regional Founder Title: </b></span><input placeholder='Title for the Founder' id='rf_title' style='width:500px' maxlength='40' class='text-input' type='text' disabled>" + 
			"</p><p><button class='button' id='update_titles' disabled>Update Titles</button><button class='button danger icon remove' id='reset_titles' disabled>Reset Titles</button>" +
			"<span id='title_error' style='margin-left: 6px; color:red; font-weight:bold; display:none'></span></p></fieldset>");
		$("#rf_label").css("margin-right", ($("#rd_label").width() - $("#rf_label").width()) + "px");
		$("#update_titles").on("click", function(event) {
			event.preventDefault();
			$("#title_error").css("color", "red").hide();
			if ($("#rd_title").val().length == 0 || $("#rf_title").val().length == 0) {
				$("#title_error").html("You can not have blank titles.").show();
			} else {
				$("#update_titles").attr("disabled", true);
				doAuthorizedPostRequest("https://nationstatesplusplus.net/api/region/title/?region=" + getVisibleRegion(), "delegate_title=" + encodeURIComponent($("#rd_title").val()) + 
																														"&founder_title=" + encodeURIComponent($("#rf_title").val()), function(data) {
					$("#update_titles").attr("disabled", false);
					$("#title_error").css("color", "green").html("Updated Titles Successfully!").show();
				}, function(error) {
					if (error.status == 401) {
						$("#title_error").html("You are not authorized to update the regional titles").show();
					} else {
						$("#title_error").text(error.responseText).show();
					}
					$("#update_titles").attr("disabled", false);
				});
			}
		});
		$("#reset_titles").on("click", function(event) {
			event.preventDefault();
			$("#reset_titles").attr("disabled", true);
			$("#title_error").css("color", "red").hide();
			doAuthorizedPostRequest("https://nationstatesplusplus.net/api/region/title/?region=" + getVisibleRegion() + "&disband=true", "", function(data) {
				$("#reset_titles").attr("disabled", false);
				$("#title_error").css("color", "green").html("Reset Titles Successfully!").show();
			}, function(error) {
				if (error.status == 401) {
					$("#title_error").html("You are not authorized to reset the regional titles").show();
				} else {
					$("#title_error").text(error.responseText).show();
				}
				$("#reset_titles").attr("disabled", false);
			});
		});
		$.get("https://nationstatesplusplus.net/api/region/title/?region=" + getVisibleRegion(), function(data) {
			if (data.delegate_title != null) {
				$("#rd_title").val(data.delegate_title).removeAttr("disabled");
			} else {
				$("#rd_title").val("WA Delegate").removeAttr("disabled");
			}
			if (data.founder_title != null) {
				$("#rf_title").val(data.founder_title).removeAttr("disabled");
			} else {
				$("#rf_title").val("Founder").removeAttr("disabled");
			}
			$("#regional_titles button").removeAttr("disabled");
		});

		//Regional Map
		$(".divindent:first").append("<div id='regional_map'><h4>" + nsppIcon + "Regional Map</h4><fieldset>" +
			"<p><span id='rml_label'><b>Regional Map Link: </b></span><input placeholder='URL to map discussion' id='region_map_link' style='width:700px' class='text-input' type='text'></p>" +
			"<p><span id='rmp_label'><b>Regional Map Preview Image: </b></span><input placeholder='URL to map image' id='region_map_preview' style='width:700px' class='text-input' type='text'>" + 
			"</p><p><button class='button' id='update_map'>Update Map</button><button class='button danger icon remove' id='disband_map'>Disband Map</button>" +
			"<span id='map_error' style='margin-left: 6px; color:red; font-weight:bold; display:none'></span></p></fieldset>");
		$("#rml_label").css("margin-right", ($("#rmp_label").width() - $("#rml_label").width()) + "px");
		$("#update_map").on("click", function(event) {
			event.preventDefault();
			$("#map_error").css("color", "red").hide();
			if ($("#region_map_link").val().length == 0) {
				$("#map_error").html("Missing Map Link").show();
			} else if ($("#region_map_preview").val().length == 0) {
				$("#map_error").html("Missing Map Preview Image").show();
			} else if ($("#region_map_link").val() == linkify($("#region_map_link").val(), false)) {
				$("#map_error").html("Invalid Region Map Link. Must be a valid url.").show();
			} else if ($("#region_map_preview").val() == linkify($("#region_map_preview").val(), false)) {
				$("#map_error").html("Invalid Region Map Preview Image. Must be a valid url.").show();
			} else {
				$("#update_map").attr("disabled", true);
				doAuthorizedPostRequest("https://nationstatesplusplus.net/api/region/map/?region=" + getVisibleRegion(), "regional_map=" + encodeURIComponent($("#region_map_link").val()) + 
																														"&regional_map_preview=" + encodeURIComponent($("#region_map_preview").val()), function(data) {
					$("#update_map").attr("disabled", false);
					$("#map_error").css("color", "green").html("Updated Map Successfully!").show();
				}, function(error) {
					if (error.status == 401) {
						$("#map_error").html("You are not authorized to update the regional map").show();
					} else {
						$("#map_error").text(error.responseText).show();
					}
					$("#update_map").attr("disabled", false);
				});
			}
		});
		$("#disband_map").on("click", function(event) {
			event.preventDefault();
			$("#disband_map").attr("disabled", true);
			$("#map_error").css("color", "red").hide();
			doAuthorizedPostRequest("https://nationstatesplusplus.net/api/region/map/?region=" + getVisibleRegion() + "&disband=true", "", function(data) {
				$("#disband_map").attr("disabled", false);
				$("#map_error").css("color", "green").html("Disbanded Map Successfully!").show();
			}, function(error) {
				if (error.status == 401) {
					$("#map_error").html("You are not authorized to disband the regional map").show();
				} else {
					$("#map_error").text(error.responseText).show();
				}
				$("#disband_map").attr("disabled", false);
			});
		});
		
		//Regional IRC
		$("<div id='regional_irc'></div>").insertAfter("#regional_newspaper");
		$("#regional_irc").html("<h4>" + nsppIcon + "Regional IRC</h4><fieldset>" +
			"<p><span id='irc_network_label'><b>IRC Network: </b></span><input placeholder='irc.esper.net' id='irc_network' style='width:500px' maxlength='40' class='text-input' type='text'></p>" +
			"<p><span id='irc_channel_label'><b>IRC Channel: </b></span><input placeholder='' id='irc_channel' style='width:500px' maxlength='40' class='text-input' type='text'>" + 
			"<p><span id='irc_port_label'><b>IRC Port: </b></span><input placeholder='6667' id='irc_port' style='width:200px' maxlength='5' class='text-input' type='number'>" + 
			"</p><p><button class='button' id='update_irc_network'>Update IRC Settings</button><button class='button danger icon remove' id='reset_irc_network'>Remove IRC Network</button>" +
			"<span id='irc_network_error' style='margin-left: 6px; color:red; font-weight:bold; display:none'></span></p>" +
			"<span id='irc_network_success' style='margin-left: 6px; color:green; font-weight:bold; display:none'></span></p></fieldset>");
		$("#irc_channel").attr("placeholder", "#" + getVisibleRegion());
		$.get("https://nationstatesplusplus.net/api/region/irc/?region=" + getVisibleRegion().toLowerCase().replaceAll(" ", "_"), function(data) {
			if (data.irc_network) {
				$("#irc_network").val(data.irc_network);
				$("#irc_channel").val(data.irc_channel);
				$("#irc_port").val(data.irc_port);
			}
		});
		$("#update_irc_network").on("click", function(event) {
			event.preventDefault();
			if ($("#irc_network").val() == "" || $("#irc_channel").val() == "" || $("#irc_port").val() == "") {
				$("#irc_network_error").html("IRC network, channel, and port must be set!").show();
				return;
			}
			$("#irc_network_error").hide();

			$("#irc_network, #irc_channel, #irc_port, #update_irc_network, #reset_irc_network").attr("disabled", true);

			getRSSPrivateKey(false, function(rssKey) {
				var postData = "irc_network=" + encodeURIComponent($("#irc_network").val()) + "&irc_channel=" + encodeURIComponent($("#irc_channel").val());
				postData += "&irc_port=" + $("#irc_port").val();
				postData += "&nation=" + encodeURIComponent(getUserNation()) + "&rss_token=" + rssKey;
				$.post("https://nationstatesplusplus.net/api/region/irc/?region=" + getVisibleRegion(), postData, function(data) {
					$("#irc_network_success").html("IRC network updated!").show();
					$("#irc_network_success").fadeOut(5000);
				}).fail(function(error) {
					$("#irc_network_error").text(error.responseText).show();
				}).always(function() {
					$("#irc_network, #irc_channel, #irc_port, #update_irc_network, #reset_irc_network").attr("disabled", false);
				});
			});
		});
		$("#reset_irc_network").on("click", function(event) {
			event.preventDefault();
			$("#irc_network_error").hide();
			$("#irc_network, #irc_channel, #irc_port, #update_irc_network, #reset_irc_network").attr("disabled", true);
			getRSSPrivateKey(false, function(rssKey) {
				postData = "&nation=" + encodeURIComponent(getUserNation()) + "&rss_token=" + rssKey;
				$.post("https://nationstatesplusplus.net/api/region/irc/?region=" + getVisibleRegion() + "&deleteIRC=true", postData, function(data) {
					$("#irc_network_success").html("IRC network reset!").show();
					$("#irc_network_success").fadeOut(5000);
					$("#irc_network, #irc_channel, #irc_port").val("");
				}).fail(function(error) {
					$("#irc_network_error").text(error.responseText).show();
				}).always(function() {
					$("#irc_network, #irc_channel, #irc_port, #update_irc_network, #reset_irc_network").attr("disabled", false);
				});
			});
		});
	}
})();