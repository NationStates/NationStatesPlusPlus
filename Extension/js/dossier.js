(function() {
	if (getVisiblePage() == "dossier_advanced") {
		$("input[type='submit']").attr("class", "button").css("font-size", "12px");
	} else if (getVisiblePage() == "dossier" && getSettings().isEnabled("fancy_dossier_theme")) {
		if (isAntiquityTheme()) {
			$("#main").html("<div id='content'>" + $("#main").html() + "</div>");
		}
		$("#content").html("<h1>" + getUserNation().replaceAll("_", " ").toTitleCase() + "'s Dossier</h1>");
		
		var advanced = "<i style='position: absolute; top: 135px; left: 500px;'><a href='page=dossier_advanced'>(Advanced)</a></i>";
		$("#content").html("<div id='nation_dossier'><h1>National Dossier</h1>" + advanced + "</div><div id='region_dossier'><h1>Regional Dossier</h1>" + advanced + "</div>");
		$("#nation_dossier").append("<button id='refresh_ndossier' title='Refresh Dossier' style='right: 400px !important' class='button clear-dossier'>Refresh</button>");
		$("#nation_dossier").append("<button id='switch_to_region_dossier' title='Switch to Region Dossier' style='right: 200px !important' class='button clear-dossier'>View Regional Dossier</button>");
		$("#nation_dossier").append("<button id='clear_national_dossier' title='Clear Dossier' class='button danger clear-dossier'>Clear National Dossier</button>");
		
		$("#region_dossier").append("<button id='refresh_rdossier' title='Refresh Dossier' style='right: 400px !important' class='button clear-dossier'>Refresh</button>");
		$("#region_dossier").append("<button id='switch_to_nation_dossier' title='Switch to Nation Dossier' style='right: 205px !important' class='button clear-dossier'>View National Dossier</button>");
		$("#region_dossier").append("<button id='clear_regional_dossier' title='Clear Dossier' class='button danger clear-dossier'>Clear Regional Dossier</button>");
		$("#region_dossier").hide();
		
		$("#clear_national_dossier, #clear_regional_dossier").click(function(event) {
			var isRegional = $(this).attr("id") == "clear_regional_dossier";
			if ($(this).html() != "Are You Sure?") {
				var html = $(this).html();
				var resetButton = function(button, html) { $(button).html(html); };
				setTimeout(resetButton, 6000, this, html);
				$(this).css("min-width", ($(this).width() + 32 )+ "px");
				$(this).html("Are You Sure?");
				return;
			}
			$.post("page=dossier" + "&nspp=1", (isRegional ? "clear_rdossier=REMOVE+ALL" : "clear_dossier=REMOVE+ALL"), function(html) {
				var dossier = $((isRegional ? "#region_dossier" : "#nation_dossier"));
				dossier.find(".dossier_element").remove();
				dossier.find(".info").remove();
				dossier.append("<p class='info'>" + $(html).find(".info").html() + "</p>");
				setTimeout(function() {
					dossier.find(".info").animate({ height: 'toggle', 'min-height': 'toggle' }, 800);
					setTimeout(function() { dossier.find(".info").remove(); }, 1000);
				}, 10000);
				currentNationPage = 0;
				loadDossierPage(isRegional, true);
			});
		});
		
		$("#refresh_ndossier").click(function() {
			currentNationPage = 0;
			$("#nation_dossier").find(".dossier_element").remove();
			loadDossierPage(false, false);
			currentNationPage += 1;
			loadDossierPage(false, false);
		});
		
		$("#refresh_rdossier").click(function() {
			currentRegionPage = 0;
			$("#region_dossier").find(".dossier_element").remove();
			loadDossierPage(true, false);
			currentRegionPage += 1;
			loadDossierPage(true, false);
		});
		
		$("#switch_to_region_dossier").click(function() {
			$("#nation_dossier").hide();
			$("#region_dossier").show();
			$("#refresh_rdossier").click();
			currentRegionPage = 0;
		});
		
		$("#switch_to_nation_dossier").click(function() {
			$("#region_dossier").hide();
			$("#nation_dossier").show();
			$("#refresh_ndossier").click();
		});
		
		$('body').on('click', "img.national_alias", function(event) {
			var nation = $(event.target).attr("id").split("alias-")[1];
			if (getNationAlias(nation) == null) {
				if ($("#input-alias-" + nation).length == 0) {
					$(event.target).parent().find(".wa_status, .last_activity").hide();
					$("<input id='input-alias-" + nation + "' type='text' class='text-input' placeholder='Alias' style='width:250px;margin-left: 10px;'>").insertAfter($(event.target));
					$("#input-alias-" + nation).on('keydown', function(e) {
						if (e.which == 13) {
							var value = $("#input-alias-" + nation).val();
							$("#input-alias-" + nation).remove();
							if (value.length > 0) {
								setNationAlias(nation, value);
								$("#alias-" + nation).attr("src", "https://nationstatesplusplus.net/nationstates/static/remove-alias.png");
								$("#alias-" + nation).attr("title", "Remove Alias");
								$("#nation-link-" + nation).css("text-decoration", "line-through");
								$("#nation-alias-" + nation).children("pre").html("  " + value);
								$(event.target).parent().find(".wa_status, .last_activity").show();
								window.onresize();
							}
						}
					});
					$("#input-alias-" + nation).focus();
				}
			} else {
				setNationAlias(nation, null);
				$(event.target).attr("src", "https://nationstatesplusplus.net/nationstates/static/alias.png");
				$(event.target).attr("title", "Set Alias");
				$("#nation-link-" + nation).css("text-decoration", "");
				$("#nation-alias-" + nation).children("pre").html("");
				window.onresize();
			}
		});
		$('body').on('click', ".dossier_element", function(event) {
			var target = $(event.target).attr("id");
			var region = $(event.target).parents("#region_dossier").length == 1;
			if (region) {
				if ($("#region_dossier").find("#iframe-" + target).length == 0) {
					$(event.target).append("<div id='iframe-" + target + "' class='nation-frame'><iframe style='width: 100%; height: 495px;' src='http://embed.nationstates.net/region=" + target + "'/></div>");
					$("#region_dossier").find("#iframe-" + target).hide();
				}
				$("#region_dossier").find("#iframe-" + target).animate({ height: 'toggle'}, 800);
			} else {
				if ($("#nation_dossier").find("#iframe-" + target).length == 0) {
					$(event.target).append("<div id='iframe-" + target + "' class='nation-frame'><iframe style='width: 100%; height: 495px;' src='http://embed.nationstates.net/nation=" + target + "'/></div>");
					$("#nation_dossier").find("#iframe-" + target).hide();
					
				}
				$("#nation_dossier").find("#iframe-" + target).animate({ height: 'toggle'}, 800);
			}
		});
		$('body').on('click', ".remove-dossier", function(event) {
			if ($(event.target).attr("nation") != null) {
				var target = $(event.target).attr("nation");
				$.post("page=dossier" + "?nspp=1", "nation=" + target + "&action=remove", function() { });
				$("#nation_dossier").find("#" + target).animate({ height: 'toggle', 'min-height': 'toggle' }, 800);
			} else if ($(event.target).attr("region") != null) {
				var target = $(event.target).attr("region");
				$.post("page=dossier" + "?nspp=1", "remove_region_" + target + "=on&remove_from_region_dossier=Remove+Marked+Regions", function() { });
				$("#region_dossier").find("#" + target).animate({ height: 'toggle', 'min-height': 'toggle' }, 800);
			}
		});

		function parseRegionDossier(html) {
			var result = {html: "", animate: []};
			if ($(html).find("table").find("th:contains('Region')").length > 0) {
				$(html).find("table").find("th:contains('Region')").parents("table").find("tbody").find("tr").each(function() {
					var regionElement = $($(this).children()[1]);
					var region = regionElement.text();
					if (regionElement.find("a").length > 0) {
						region = regionElement.find("a").attr("href").substring(7);
					}
					region = region.toLowerCase().replaceAll(" ", "_");
					var nations = $($(this).children()[2]).html();
					nations = (typeof nations == "undefined" ? "0" : nations);
					var delegate = "None";
					var delegateFlag = "";
					try {
						if ($($(this).children()[3]).find(".nlink").length == 1) {
							delegate = $($(this).children()[3]).find(".nlink").attr("href").substring(7);
							delegateFlag = $($(this).children()[3]).find(".smallflag").attr("src");
						}
					} catch (error) { }
					if ($("#region_dossier").find("#" + region).length == 0 && !result.html.contains("<div id='" + region + "'")) {
						result.html += "<div id='" + region + "' class='dossier_element' style='min-height:28px;'><img region='" + region + "' src='https://nationstatesplusplus.net/nationstates/static/remove.png' class='remove-dossier' title='Remove from Dossier'><img class='smallflag' src='https://nationstatesplusplus.net/api/flag/region/?region=" + region + "'><a style='font-weight:bold' target='_blank' href='//www.nationstates.net/region=" + region + "'>" + region.replaceAll("_", " ").toTitleCase() + "</a><div class='last_activity'>Nations: " + nations + "</div>";
						if (delegateFlag.length > 0) {
							result.html += "<div class='region_activity'><b>Delegate:</b><img class='smallflag' src='" + delegateFlag + "'><a target='_blank' href='/nation=" + delegate + "'>" + delegate.replaceAll("_", " ").toTitleCase() + "</a></div>";
						}
						result.animate.push(region);
						result.html += "</div>";
					}
				});
			} else {
				result.html = "<div class='last_dossier_element dossier_element'>Your Regional Dossier is Empty!</div>";
			}
			return result;
		}
		
		function parseNationDossier(html) {
			var result = {html: "", animate: []};
			var nationTable = $(html).find("table").find("thead").find("th:contains('WA Category')");
			if (nationTable.length == 0) {
				result.html = "<div class='last_dossier_element dossier_element'>Your National Dossier is Empty!</div>";
			} else {
				nationTable.parents("table").find("tbody").find("tr").each(function() {
					var alive = true;
					var nation;
					var flag;
					var waMember = $(this).html().contains("WA Delegate") || $(this).html().contains("WA Member");
					if ($(this).children().length == 2) {
						nation = $($(this).children()[1]).html().replaceAll(" ", "_").toLowerCase();
						flag = "//www.nationstates.net/images/flags/exnation.png";
						alive = false;
					} else {
						nation = $(this).find(".nlink").attr("href").substring(7)
						flag = $(this).find(".smallflag").attr("src");
					}
					if ($("#nation_dossier").find("#" + nation).length == 0 && !result.html.contains("<div id='" + nation + "'")) {
						result.animate.push(nation);
						var alias = getNationAlias(nation);

						result.html += "<div id='" + nation + "' class='dossier_element'><img nation='" + nation + "' src='https://nationstatesplusplus.net/nationstates/static/remove.png' class='remove-dossier' title='Remove from Dossier'><img class='smallflag' src='" + flag + "'><a id='nation-link-" + nation + "' style='font-weight:bold; " + (alias != null ? "text-decoration:line-through;" : "") + "' target='_blank' href='//www.nationstates.net/nation=" + nation + "'>" + nation.replaceAll("_", " ").toTitleCase() + "</a>";
						
						var rssLink = alive ? "<a class='dossier-rss' href='/cgi-bin/rss.cgi?nation=" + nation + "'><img src='/images/rss3.png' alt='RSS' title='National Happenings Feed'></a>" : "<span style='margin-right:13px'></span>";

						if (alias == null) {
							result.html += "<span id='nation-alias-" + nation + "'><pre style='display: inline;'></pre></span>" + rssLink + "<img src='https://nationstatesplusplus.net/nationstates/static/alias.png' title='Set Alias' class='national_alias' id='alias-" + nation + "'>";
						} else {
							result.html += "<span id='nation-alias-" + nation + "'><pre style='display: inline;'>  " + alias + "</pre></span>" + rssLink + "<img src='https://nationstatesplusplus.net/nationstates/static/remove-alias.png' title='Remove Alias' class='national_alias' id='alias-" + nation + "'>";
						}
						
						if (waMember) {
							result.html += "<div class='wa_status dossier-wa'></div>";
						}
						if ($(this).children().length == 4) {
							var activityHtml = $($(this).children()[3]).html();
							var lastActivity = activityHtml.substring(0, activityHtml.indexOf("<br>"));
							var region = $(this).find("a[href*='region=']").attr("href").substring(7);
							var regionTitle =  $(this).find("a[href*='region=']").html();
							var censusType = $($(this).children()[2]).text();
							//For liberal/convervative titles
							if ($(this).find(".aflabel").length > 0) {
								censusType = $(this).find(".aflabel").text();
							}
							result.html += "<div class='last_activity'>" + lastActivity + "<span style='width:50px;display: inline-block;'> </span>(" + censusType + ") </div><div class='region_activity'><a target='_blank' href='/region=" + region + "'><img class='smallflag' src='https://nationstatesplusplus.net/api/flag/region/?region=" + region + "'>" + regionTitle + "</a></div>";
						}
						result.html += "</div>";
					}
				});
			}
			return result
		}

		var currentRegionPage = 0;
		var currentNationPage = 0;
		loadDossierPage = function(region, animate) {
			if ((region ? $("#region_dossier") : $("#nation_dossier")).find(".last_dossier_element").length > 0) {
				return;
			}
			$.get("page=dossier?start=" + (currentNationPage * 15) + "&rstart=" + (currentRegionPage * 15) + "&nspp=1", function(html) {
				var dossier = region ? $("#region_dossier") : $("#nation_dossier");
				var result;
				if (region) {
					result = parseRegionDossier(html);
				} else {
					result = parseNationDossier(html);
				}
				dossier.append(result.html);
				if (animate) {
					for (var i = 0; i < result.animate.length; i++) {
						if (animate) {
							dossier.find("#" + result.animate[i]).hide().animate({ height: 'toggle', 'min-height': 'toggle' }, 800);
						}
					}
				}
				$(window).resize();
			});
		}

		$(window).resize(function() {
			if ($("#nation_dossier:visible").length == 1) {
				var minWidth = Math.min(400, Math.max($(window).width() - 1250, 0));
				$("#nation_dossier").find(".dossier_element").each(function() {
					var nation = $(this).attr('id');
					var ref = $("#nation_dossier").find("#nation-link-" + nation);
					var alias = $("#nation_dossier").find("#nation-alias-" + nation);
					var margin = Math.max(0, minWidth - ref.width() + (40 - ref.parent().find(".smallflag:first").width()) - alias.width());
					if (margin != alias.css("margin-right")) {
						alias.css("margin-right", margin + "px");
					}
				});
			}
		});

		loadDossierPage(false, false);
		currentNationPage += 1;
		loadDossierPage(false, false);
		setTimeout(function() { $(window).resize(); }, 500);

		$(window).scroll(function () {
			if ($(window).scrollTop() + 400 > ($(document).height() - $(window).height())) {
				if ($("#nation_dossier:visible").length == 1) {
					currentNationPage += 1;
					loadDossierPage(false, true);
				} else if ($("#region_dossier:visible").length == 1) {
					currentRegionPage += 1;
					loadDossierPage(true, true);
				}
			}
		});
	}
})();