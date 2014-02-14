(function() {
	if (getVisiblePage() == "region_control") {
		$("input[name='nation_name'], #rpassword").addClass("text-input");
		$("input[type='button']").addClass("button");
		
		//Found Newspaper button
		$("<div id='regional_newspaper'></div>").insertBefore("h4:contains('Welcome Telegrams')");
		$("#regional_newspaper").html("<h4>Regional Newspaper</h4>");
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
		$(".divindent:first").append("<div id='regional_titles'><h4>Regional Titles</h4><fieldset>" +
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
						$("#title_error").html(error.responseText).show();
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
					$("#title_error").html(error.responseText).show();
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
		$(".divindent:first").append("<div id='regional_map'><h4>Regional Map</h4><fieldset>" +
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
						$("#map_error").html(error.responseText).show();
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
					$("#map_error").html(error.responseText).show();
				}
				$("#disband_map").attr("disabled", false);
			});
		});
		
		//Recruitment Options
		$("<div id='recruitment' class='divindent'></div>").insertBefore("h2:contains('Communication')");
		var addRecruitmentForm = function() {
			$("#recruitment").html("<h2>Regional Recruitment</h2><div id='existing_recruitment'></div><div id='recruitment_form'></div>");
			
			$("#recruitment_form").append("<label for='client_key'>Client Key: </label><input class='text-input' placeholder='Client Key' name='client_key' type='text' style='width:400px'></input> <span title='A Client Key can be requested from a Getting Help Request. Once it has been requested, it may take up to 24 hours for the request to be filled, so be patient.' style='font-size:10px'><a href='/page=help?recruitment'>(What is this?)</a></span><br/>");
			$("label[for='client_key']").css("margin-right", Math.max(0, (130 - $("label[for='client_key']").width())) + "px");
			
			$("#recruitment_form").append("<label for='tgid'>TGID: </label><input name='tgid' class='text-input' placeholder='Telegram Id' type='text' style='width:400px'></input> <span title='Send your recruitment telegram to \"tag:api\" to receive a tgid and secret key' style='font-size:10px'> <a href='//www.nationstates.net/pages/api.html#telegrams'>(What is this?)</a></span><br/>");
			$("label[for='tgid']").css("margin-right", Math.max(0, (130 - $("label[for='tgid']").width())) + "px");
			
			$("#recruitment_form").append("<label for='secretKey'>Secret Key: </label><input class='text-input' placeholder='Telegram Secret Key' name='secretKey' type='text' style='width:400px'></input> <span title='Send your recruitment telegram to \"tag:api\" to receive a tgid and secret key' style='font-size:10px'> <a href='//www.nationstates.net/pages/api.html#telegrams'>(What is this?)</a></span><br/>");
			$("label[for='secretKey']").css("margin-right",  Math.max(0, (130 - $("label[for='secretKey']").width())) + "px");
			
			$("#recruitment_form").append("<div style='margin-bottom: -15px;'><label for='percent'>Percent: </label><input name='percent' type='range' min='1' value='100' max='100' style='width:426px; position: relative; top: 6px;'></input> <span style='font-size:10px;'><input style='min-width:26px; width:26px;' class='text-input' name='percent_input' type='text' max='100' min='1' size='2' value='100'> (Percent of requests allocated)</span></div><br/>");
			$("label[for='percent']").css("margin-right",  Math.max(0, (130 - $("label[for='percent']").width())) + "px");
			
			$("#recruitment_form").append("<label for='type'>Type: </label><select name='type'><option value='0'>New Nations</option><option value='1'>Refounded Nations</option><option value='2'>Ejected Nations</option></select><br/>");
			$("label[for='type']").css("margin-right",  Math.max(0, (130 - $("label[for='type']").width())) + "px");
			
			$("#recruitment_form").append("<div style='margin-bottom: -15px;'><label for='feedersOnly'>GCR's Only: </label><input name='feedersOnly' type='checkbox' style='position: relative; top: 2px;'></input><span style='font-size:10px; position: relative; top: -1px;'> (Arnhelm Signatories)</span></div><br/>");
			$("label[for='feedersOnly']").css("margin-right",  Math.max(0, (130 - $("label[for='feedersOnly']").width())) + "px");

			$("#recruitment_form").append("<div style='margin-bottom: -15px;'><label for='randomize'>Randomize: </label><input name='randomize' type='checkbox' style='position: relative; top: 2px;'></input><span style='font-size:10px; position: relative; top: -1px;' title='Instead of sending telegrams to the most recent arrivals, they are sent to any qualifying nation in the last 24 hours.'> (What is this?)</span></div><br/>");
			$("label[for='randomize']").css("margin-right",  Math.max(0, (130 - $("label[for='randomize']").width())) + "px");
			
			$("#recruitment_form").append("<label for='filterRegex'>Nation Filter: </label><input class='text-input' placeholder='Optional Regex' name='filterRegex' type='text' style='width:400px'></input> <span style='font-size:10px;' title='Regex to filter out nations with undesirable names. Optional, may be ignored.'> (What is this?)</span><br/>");
			$("label[for='filterRegex']").css("margin-right",  Math.max(0, (130 - $("label[for='filterRegex']").width())) + "px");
			
			$("#recruitment_form").append("<p class='error' style='display:none;'></p>");
			$("#recruitment_form").append("<button id='begin_recruitment' class='button'><b>Begin Recruitment</b></button>");
			
			$("input[name='percent']").on("change", function() {
				$("input[name='percent_input']").val($(this).val());
			});
			$("input[name='percent_input']").on("change", function() {
				$("input[name='percent_input']").val(Math.max(1, Math.min(100, $(this).val())));
				$("input[name='percent']").val($("input[name='percent_input']").val());
			});

			$("#begin_recruitment").on("click", function(event) {
				event.preventDefault();
				if ($("input[name='client_key']").val() == "") {
					$("p.error").html("Missing Client Key!").show();
					return;
				}
				if ($("input[name='tgid']").val() == "" || !isNumber($("input[name='tgid']").val())) {
					$("p.error").html("Missing TGID!").show();
					return;
				}
				if ($("input[name='secretKey']").val() == "") {
					$("p.error").html("Missing Secret Key!").show();
					return;
				}
				if ($("input[name='filterRegex']").val() != "") {
					try {
						new RegExp($("input[name='filterRegex']").val());
					} catch (e) {
						$("p.error").html("Invalid Regex!").show();
						return;
					}
				}
				$("p.error").hide();
				var postData = "clientKey=" + $("input[name='client_key']").val();
				postData += "&tgid=" + $("input[name='tgid']").val();
				postData += "&secretKey=" + $("input[name='secretKey']").val();
				postData += "&percent=" + $("input[name='percent']").val();
				postData += "&type=" + $("select[name='type']").val();
				postData += "&feedersOnly=" + $("input[name='feedersOnly']").prop("checked");
				postData += "&filterRegex=" + $("input[name='filterRegex']").val();
				postData += "&randomize=" + $("input[name='randomize']").prop("checked");
				if ($("#begin_recruitment").attr("data-id") != "" && $("#begin_recruitment").attr("data-id") != null) {
					postData += "&id=" + $("#begin_recruitment").attr("data-id");
				}
				doAuthorizedPostRequest("https://nationstatesplusplus.net/api/region/recruitment/set?region=" + getVisibleRegion(), postData, function(data) {
					addRecruitmentForm();
					fetchRecruitmentActions();
				}, function() {
					$("p.error").html("You do not have permission to modify recruitment for this region!").show();
				});
			});
		};
		addRecruitmentForm();
		
		var fetchRecruitmentActions = function() {
			doAuthorizedPostRequest("https://nationstatesplusplus.net/api/region/recruitment/get?region=" + getVisibleRegion(), "", function(data) {
				var html = "";
				for (var i = 0; i < data.length; i++) {
					html += "<div id='recruitment_" + data[i].id + "'><div><b>Recruitment Type</b>: " + data[i].type.replaceAll("_", " ") + "</div>";
					html += "<div><b>TGID</b>: " + data[i].tgid + "</div>";
					html += "<div><b>Percent Allocated</b>: " + data[i].percent + "%</div>";
					html += "<div><b>GCR's Only</b>: " + data[i].feedersOnly + "</div>";
					html += "<div><b>Randomize</b>: " + data[i].randomize + "</div>";
					html += "<div><b>Nation Filter</b>: " + data[i].filterRegex + "</div>";
					html += "<div><b>Sent Telegrams</b>: <span name='sent_tgs_" + data[i].tgid + "'></span></div>";
					html += "<div><b>Successful Telegrams</b>: <span name='success_tgs_" + data[i].tgid + "'></span></div>";
					if (data[i].error != 0) {
						html += "<div><p class='error'>" + data[i].errorMessage + " Contact <a href='/nation=shadow_afforess'>Afforess</a> if errors persist.<p></div>";
					}
					html += "<button class='button' name='cancel_recruitment' id='" + data[i].id + "'>Cancel Recruitment</button>";
					html += "<button class='button' name='edit_recruitment' id='" + data[i].id + "'>Edit Recruitment</button>";
					html += "<hr style='width: 55%; color:black; border: 1px solid black; margin-left: 0;'></hr></div>";
					doAuthorizedPostRequest("https://nationstatesplusplus.net/api/region/recruitment/success?region=" + getVisibleRegion() + "&tgid=" + data[i].tgid, "", function(data) {
						$("span[name='sent_tgs_" + data.tgid + "']").html(data.sent_telegrams);
						var rate = Math.floor((data.successful_telegrams / (data.sent_telegrams + 1)) * 10000) / 100;
						$("span[name='success_tgs_" + data.tgid + "']").html(data.successful_telegrams + " (" + rate + "%)");
					});
				}
				$("#existing_recruitment").html(html);
				$("button[name='cancel_recruitment']").on("click", function(event) {
					event.preventDefault();
					doAuthorizedPostRequest("https://nationstatesplusplus.net/api/region/recruitment/set?region=" + getVisibleRegion(), "id=" + $(this).attr("id") + "&cancel=1", function(data) {
						fetchRecruitmentActions();
					});
				});
				$("button[name='edit_recruitment']").on("click", function(event) {
					event.preventDefault();
					var id = $(this).attr("id");
					doAuthorizedPostRequest("https://nationstatesplusplus.net/api/region/recruitment/get?region=" + getVisibleRegion(), "", function(data) {
						addRecruitmentForm();
						for (var i = 0; i < data.length; i++) {
							if (data[i].id == id) {
								$("input[name='client_key']").val(data[i].clientKey);
								$("input[name='tgid']").val(data[i].tgid);
								$("input[name='secretKey']").val(data[i].secretKey);
								$("input[name='percent']").val(data[i].percent);
								$("input[name='percent_input']").val(data[i].percent);
								$("select[name='type']").val(data[i].type == "NEW_NATIONS" ? 0 : (data[i].type == "REFOUNDED_NATIONS" ? 1 : 2));
								$("input[name='filterRegex']").val(data[i].filterRegex);
								$("input[name='avoidFull']").prop("checked", data[i].avoidFull);
								$("input[name='randomize']").prop("checked", data[i].randomize);
								$("input[name='feedersOnly']").prop("checked", data[i].feedersOnly);
								$("#begin_recruitment").html("Update Recruitment");
								$("#begin_recruitment").attr("data-id", data[i].id);
								break;
							}
						}
					});
				});
			});
		};
		fetchRecruitmentActions();
	}
})();