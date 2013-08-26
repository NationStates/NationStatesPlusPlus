(function() {
	if (getVisiblePage() == "reports") {
		var reportForm = $("form[action='page=reports']");
		var reportHours = $("input[name='report_hours']").val();
		var reportSelf = $("input[name='report_self']").prop('checked');
		var reportRegion = $("input[name='report_region']").prop('checked');
		var reportDossierNations = $("input[name='report_dossier']").prop('checked');
		var reportDossierRegions = isSettingEnabled("report_dossier_regions");
		
		var reportHtml = "<p>Show reports from last <input name='report_hours' size='7' maxlength='15' value='" + reportHours + "'>" +
		" hours, including <input type='checkbox' name='report_self' value='1'> <a href='page=display_nation'>self</a>," + 
		"<input type='checkbox' name='report_region' value='1'><a href='page=display_region'>region</a>," + 
		"<input type='checkbox' name='report_dossier' value='1' ><a href='page=dossier'>dossier</a> nations," +
		" <input type='checkbox' name='report_region_dossier' value='1' ><a href='page=dossier'>dossier</a> regions. <button id='generate_report' class='button'>Generate Report</button></p>";
		
		reportForm.html(reportHtml);
		$("input[name='report_self']").prop("checked", reportSelf);
		$("input[name='report_region']").prop("checked", reportRegion);
		$("input[name='report_dossier']").prop("checked", reportDossierNations);
		$("input[name='report_region_dossier']").prop("checked", reportDossierRegions);
		
		$("#generate_report").click(function(event) {
			event.preventDefault();
			console.log("Generate Report");
			updateReports();
		});
		
		$("h2").next().remove();
		$("h2").remove();
		$("<div id='report_self'><h2>National Report</h2><ul name='report'></ul></div><div id='report_region'><h2>Regional Report</h2><ul name='report'></ul></div><div id='report_dossier'><h2>National Dossier Report</h2><ul name='report'></ul></div><div id='report_dossier_regions'><h2>Regional Dossier Report</h2><div id='regional_reports'></div></div>").insertAfter(reportForm);
		
		updateReports();
	}

	function updateReports() {
		NProgress.start();
		if (!$("input[name='report_self']").prop('checked')) {
			$("#report_self").hide();
		} else {
			$("#report_self").show();
			loadReport("report_self");
		}
		if (!$("input[name='report_region']").prop('checked')) {
			$("#report_region").hide();
		} else {
			$("#report_region").show();
			loadReport("report_region");
		}
		if (!$("input[name='report_dossier']").prop('checked')) {
			$("#report_dossier").hide();
		} else {
			$("#report_dossier").show();
			loadReport("report_dossier");
		}
		if (!$("input[name='report_region_dossier']").prop("checked")) {
			$("#report_dossier_regions").hide();
			localStorage.setItem("report_dossier_regions", false);
		} else {
			$("#regional_reports").html("");
			$("#report_dossier_regions").show();
			localStorage.setItem("report_dossier_regions", true);
			generateRegionDossierReport(0, 0);
		}
	}
	
	function generateRegionDossierReport(offset, baseDelay) {
		console.log("Generating Region Dossier Report, Offset: " + offset);
		$.get("http://www.nationstates.net/page=dossier?rstart=" + offset, function(data) {
			$(data).find("table").each(function() {
				var rows = $(this).find("tbody").find("tr");
				console.log("Rows:");
				console.log(rows);
				console.log($(rows[0]).children());
				if (rows.length > 0 && $(rows[0]).children().length == 4) {
					var foundNew = false;
					var delay = baseDelay;
					for (var i = 0; i < rows.length; i++) {
						var row = $(rows[i]);
						var href = row.find("a:first").attr("href");
						var region = href.substring(7).toLowerCase().replaceAll(" ", "_");
						console.log("Region: " + region);
						if ($("#regional_reports").find("#" + region).length == 0) {
							delay += 6000;
							$("#regional_reports").append("<div id='" + region + "'><h3><a href='" + href + "'>" + region.replaceAll("_", " ").toTitleCase() + "</a></h3></div>");
							console.log("Delay: " + delay);
							setTimeout(loadRegionHappenings, delay, region);
							foundNew = true;
						}
					}
					if (foundNew) {
						setTimeout(generateRegionDossierReport, 1000, offset + 15, delay);
					} else {
						setTimeout(function() { NProgress.done(); }, delay + 1000);
					}
				}
			});
		});
	}

	function loadRegionHappenings(region) {
		console.log("Loading happenings for: " + region);
		$.get("http://www.nationstates.net/region=" + region, function(data) {
			$("#" + region).append("<ul id='" + region + "_list' style='display:none;'>" + $(data).find("h3:contains('Regional Happenings')").next().html() + "</ul");
			$("#" + region + "_list").animate({height: "toggle"}, 600);
		});
	}

	function loadReport(reportName) {
		$.post("page=reports", "report_hours=" + reportHours + "&" + reportName + "=1&generate_report=Generate+Report", function(data) {
			var report = $(data).find("h2").next();
			$("#" + reportName).find("ul[name='report']").html(report.html());
			if (!isSettingEnabled("report_dossier_regions")) {
				setTimeout(function() { NProgress.done() }, 1000);
			}
		});
	}
})();
