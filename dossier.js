(function() {
	if (getVisiblePage() == "dossier_advanced") {
		$("input[type='submit']").attr("class", "button").css("font-size", "12px");
	} else if (getVisiblePage() == "dossier" && isSettingEnabled("fancy_dossier_theme")) {
		if (isAntiquityTheme()) {
			$("#main").html("<div id='content'>" + $("#main").html() + "</div>");
		}
		$("#content").html("<h1>" + getUserNation().replaceAll("_", " ").toTitleCase() + "'s Dossier</h1>");
		
		var advanced = "<i style='position: absolute; top: 135px; left: 500px;'><a href='page=dossier_advanced'>(Advanced)</a></i>";
		$("#content").html("<div id='nation_dossier'><h1>National Dossier</h1>" + advanced + "</div><div id='region_dossier'><h1>Regional Dossier</h1>" + advanced + "</div>");
		$("#nation_dossier").append("<button id='refresh_ndossier' title='Refresh Dossier' style='right: 400px' class='button clear-dossier'>Refresh</button>");
		$("#nation_dossier").append("<button id='switch_to_region_dossier' title='Switch to Region Dossier' style='right: 200px' class='button clear-dossier'>View Regional Dossier</button>");
		$("#nation_dossier").append("<button id='clear_national_dossier' title='Clear Dossier' class='button danger clear-dossier'>Clear National Dossier</button>");
		
		$("#region_dossier").append("<button id='refresh_rdossier' title='Refresh Dossier' style='right: 400px' class='button clear-dossier'>Refresh</button>");
		$("#region_dossier").append("<button id='switch_to_nation_dossier' title='Switch to Nation Dossier' style='right: 205px' class='button clear-dossier'>View National Dossier</button>");
		$("#region_dossier").append("<button id='clear_regional_dossier' title='Clear Dossier' class='button danger clear-dossier'>Clear Regional Dossier</button>");
		$("#region_dossier").hide();
		
		$("#clear_national_dossier, #clear_regional_dossier").click(function(event) {
			var isRegional = $(this).attr("id") == "clear_regional_dossier";
			$.post("page=dossier", (isRegional ? "clear_rdossier=REMOVE+ALL" : "clear_dossier=REMOVE+ALL"), function(html) {
				var dossier = $((isRegional ? "#region_dossier" : "#nation_dossier"));
				dossier.find(".dossier_element").remove();
				dossier.find(".info").remove();
				dossier.append("<p class='info'>" + $(html).find(".info").html() + "</p>");
				setTimeout(function() {
					dossier.find(".info").animate({ height: 'toggle', 'min-height': 'toggle' }, 800);
					setTimeout(function() { dossier.find(".info").remove(); }, 1000);
				}, 10000);
				currentNationPage = 0;
				endNationDossier = false;
				loadDossierPage(isRegional, true);
			});
		});
		
		$("#refresh_ndossier").click(function() {
			currentNationPage = 0;
			endNationDossier = false;
			$("#nation_dossier").find(".dossier_element").remove();
			loadDossierPage(false, false);
		});
		
		$("#refresh_rdossier").click(function() {
			currentRegionPage = 0;
			endRegionDossier = false;
			$("#region_dossier").find(".dossier_element").remove();
			loadDossierPage(true, false);
		});
		
		$("#switch_to_region_dossier").click(function() {
			$("#nation_dossier").hide();
			$("#region_dossier").show();
			$("#refresh_rdossier").click();
		});
		
		$("#switch_to_nation_dossier").click(function() {
			$("#region_dossier").hide();
			$("#nation_dossier").show();
			$("#refresh_ndossier").click();
		});

		$(document.body).click(function(event) {
			var target;
			if ($(event.target).attr("class") == "dossier_element") {
				target = $(event.target).attr("id");
			} else {
				target = $(event.target).parents(".dossier_element").attr("id");
			}
			if (target && target != "last_nation_element") {
				if ($("#nation_dossier:visible").length == 1) {
					if (typeof $(event.target).attr("id") != "undefined" && $(event.target).attr("id").startsWith("remove-")) {
						console.log("Removing: " + target);
						$.post("page=dossier", "nation=" + target + "&action=remove", function() { });
						$("#nation_dossier").find("#" + target).animate({ height: 'toggle', 'min-height': 'toggle' }, 800);
					} else {
						if (typeof $("#iframe-" + target).html() == "undefined") {
							$("#nation_dossier").find("#" + target).html($("#" + target).html() + "<div id='iframe-" + target + "' class='nation-frame'><iframe style='width: 100%; height: 495px;' src='http://nationstates.net/nation=" + target + "?hideBanner=true&hideFooter=true&hidePanel=true&hideFlag=true'/></div>");
							$("#nation_dossier").find("#iframe-" + target).hide();
						}
						$("#nation_dossier").find("#iframe-" + target).animate({ height: 'toggle'}, 800);
					}
				} else {
					if (typeof $(event.target).attr("id") != "undefined" && $(event.target).attr("id").startsWith("remove-")) {
						$.post("page=dossier", "remove_region_" + target + "=on&remove_from_region_dossier=Remove+Marked+Regions", function() { });
						$("#region_dossier").find("#" + target).animate({ height: 'toggle', 'min-height': 'toggle' }, 800);
					} else {
						if (typeof $("#iframe-" + target).html() == "undefined") {
							$("#region_dossier").find("#" + target).html($("#" + target).html() + "<div id='iframe-" + target + "' class='nation-frame'><iframe style='width: 100%; height: 495px;' src='http://nationstates.net/region=" + target + "?hideBanner=true&hideFooter=true&hidePanel=true&hideFlag=true'/></div>");
							$("#region_dossier").find("#iframe-" + target).hide();
						}
						$("#region_dossier").find("#iframe-" + target).animate({ height: 'toggle'}, 800);
					}
				}
			}
		});

		var currentRegionPage = 0;
		var endRegionDossier = false;
		
		var currentNationPage = 0;
		var endNationDossier = false;
		loadDossierPage = function(region, animate) {
			if ((region && endRegionDossier) || (!region && endNationDossier)) {
				return;
			}
			var targets = [];
			$.get("page=dossier?start=" + (currentNationPage * 15), function(html) {
				var dossierHtml = "";
				if (region) {
					$(html).find("table").find("tbody").find("tr").each(function() {
						if ($(this).children().length == 4) {
							var region = $($(this).children()[1]).find("a").attr("href").substring(7);
							var nations = $($(this).children()[2]).html();
							var delegate = "None";
							var delegateFlag = "";
							try {
								if ($($(this).children()[3]).find(".nlink").length == 1) {
									delegate = $($(this).children()[3]).find(".nlink").attr("href").substring(7);
									delegateFlag = $($(this).children()[3]).find(".smallflag").attr("src");
								}
								console.log("Delegate: " + delegate + " flag: " + delegateFlag);
							} catch (error) {
							}
							if ($("#region_dossier").find("#" + region).length == 0) {
								dossierHtml += "<div id='" + region + "' class='dossier_element'" + (animate ? "style='display:none; min-height:28px;'" : "style='min-height:28px'") + "><div><img id='remove-" + region + "' src='http://capitalistparadise.com/nationstates/static/remove.png' class='remove-dossier' title='Remove from Dossier'><a style='font-weight:bold' target='_blank' href='http://nationstates.net/region=" + region + "'>" + region.replaceAll("_", " ").toTitleCase() + "</a><div class='last_activity'>Nations: " + nations + "</div>";
								if (delegateFlag.length > 0) {
									dossierHtml += "<div class='region_activity'><b>Delegate:</b><img class='smallflag' src='" + delegateFlag + "'><a target='_blank' href='/nation=" + delegate + "'>" + delegate.replaceAll("_", " ").toTitleCase() + "</a></div>";
								}
								targets.push(region);
								$.get("http://capitalistparadise.com/api/regionflag/?region=" + region, function(json) {
									for (var regionName in json) {
										var flag = json[regionName];
										if (flag != null && flag.length > 0) {
											var regionDiv = $("#region_dossier").find("#" + regionName).find(".last_activity").parent();
											if (regionDiv.find(".smallflag").length <= 1) {
												$("<img class='smallflag' src='" + flag + "'/>").insertAfter(regionDiv.find(".remove-dossier"));
											}
										}
									}
								});
								dossierHtml += "</div></div>";
							}
						}
					});
				} else {
					$(html).find("table:first").find("tbody").find("tr").each(function() {
						//They have no nations in their dossier!
						if ($(this).children().length == 4) {
							dossierHtml = "<div id='last_nation_element' style='cursor: default;text-align: center;font-weight: bold;' class='dossier_element'>Your Dossier is Empty!</div>";
							endNationDossier = true;
							return true;
						}
						var nation;
						var flag;
						var waMember = $(this).html().contains("WA Delegate") || $(this).html().contains("WA Member");
						if ($(this).children().length == 3) {
							nation = $($(this).children()[2]).html().replaceAll(" ", "_").toLowerCase();
							flag = "http://www.nationstates.net/images/flags/exnation.png";
						} else {
							nation = $(this).find(".nlink").attr("href").substring(7)
							flag = $(this).find(".smallflag").attr("src");
						}
						if ($("#nation_dossier").find("#" + nation).length == 0) {
							targets.push(nation);
							dossierHtml += "<div id='" + nation + "' class='dossier_element'" + (animate ? "style='display:none;'" : "") + "><div><img id='remove-" + nation + "' src='http://capitalistparadise.com/nationstates/static/remove.png' class='remove-dossier' title='Remove from Dossier'><img class='smallflag' src='" + flag + "'><a style='font-weight:bold' target='_blank' href='http://nationstates.net/nation=" + nation + "'>" + nation.replaceAll("_", " ").toTitleCase() + "</a>"
							if (waMember) {
								dossierHtml += "<div class='wa_status dossier-wa'></div>";
							}
							if ($(this).children().length == 5) {
								var activityHtml = $($(this).children()[4]).html();
								var lastActivity = activityHtml.substring(0, activityHtml.indexOf("<br>"));
								var region = $($($(this).children()[4]).children()[1]).attr("href").substring(7);
								var formattedRegion = region.replaceAll(" ", "_").toLowerCase();
								dossierHtml += "<div class='last_activity'>" + lastActivity + "<pre style='display: inline;'>&#9;&#9;</pre>(" + $($(this).children()[3]).text() + ") </div><div class='region_activity'><a target='_blank' href='/region=" + formattedRegion + "'>" + region + "</a></div>";
								$.get("http://capitalistparadise.com/api/regionflag/?region=" + formattedRegion, function(json) {
									for (var regionName in json) {
										var flag = json[regionName];
										if (flag != null && flag.length > 0) {
											var regionDiv = $("#nation_dossier").find("#" + nation).find(".region_activity");
											if (regionDiv.find(".smallflag").length == 0) {
												regionDiv.html("<img class='smallflag' src='" + flag + "'/>" + regionDiv.html());
											}
										}
									}
								});
							}
							dossierHtml += "</div></div>";
						}
					});
				}
				if (dossierHtml.length == 0 && ((region && !endRegionDossier) || (!region && !endNationDossier))) {
					dossierHtml = "<div id='last_nation_element' style='cursor: default;text-align: center;font-weight: bold;' class='dossier_element'>End of Dossier</div>";
					if (region) {
						endRegionDossier = true;
					} else {
						endNationDossier = true;
					}
				}
				var dossier = region ? $("#region_dossier") : $("#nation_dossier");
				dossier.append(dossierHtml);
				if (animate) {
					for (var i = 0; i < targets.length; i++) {
						dossier.find("#" + targets[i]).hide().animate({ height: 'toggle', 'min-height': 'toggle' }, 800);
					}
				}
			});
		}
		loadDossierPage(false, false);
		
		$(window).scroll(function handleInfiniteScroll() {
			if ($(window).scrollTop() + 400 > ($(document).height() - $(window).height())) {
				if ($("#nation_dossier:visible").length == 1) {
					currentNationPage += 1;
					loadDossierPage(false, true);
				} else {
					currentRegionPage += 1;
					loadDossierPage(true, true);
				}
			}
		});
	}
})();