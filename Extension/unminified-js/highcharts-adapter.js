(function() {
	//Add string.startsWith
	String.prototype.startsWith = function (str){
		return this.slice(0, str.length) == str;
	};

	function getVisibleRegion() {
		var split = window.location.href.split(/[/#/?]/);
		for (var i = 0; i < split.length; i++) {
			if (split[i].startsWith("region=")) {
				return split[i].substring(7).toLowerCase().split(" ").join("_");
			}
		}
		return "";
	}

	function isDarkTheme() {
		return $("link[href^='/ns.dark']").length > 0;
	}	

	function getVisibleNation() {
		if ($(".bannernation a").length > 0) {
			return $(".bannernation a").attr("href").trim().substring(8);
		}
		return $(".nationname > a").attr("href") ? $(".nationname > a").attr("href").trim().substring(8) : "";
	}

	checkUpdates();
	function checkUpdates() {
		if ($("#highcharts_graph").length > 0) {
			chart = {};
			chart.type = $("#highcharts_graph").attr("graph");
			chart.region = $("#highcharts_graph").attr("region");
			chart.title = $("#highcharts_graph").attr("title");
			chart.width = $("#highcharts_graph").attr("width");
			chart.height = $("#highcharts_graph").attr("height");
			chart.visibleNation = $("#highcharts_graph").attr("visible_nation");
			chart.showInfluence = $("#highcharts_graph").attr("show_influence") == "true";
			$("#highcharts_graph").remove();

			if (chart.type == "region_chart" && getVisibleRegion() == chart.region) {
				drawRegionPopulationChart(chart.region, chart.title);
			} else if (chart.type == "set_chart_size") {
				updateChartSize(chart.width, chart.height);
			} else if (chart.type == "national_power" && getVisibleNation() == chart.visibleNation) {
				drawNationalPowerChart(chart.region, chart.title, chart.visibleNation, chart.showInfluence);
			}
		}

		if ($("div[name='save_file']").length > 0) {
			$("div[name='save_file']").each(function() {
				console.log("Attempting to save: " + $(this).attr("file"));
				var html = $(this).html();
				var data = JSON.parse(html);
				var blob = new Blob(data, {type: "text/plain;charset=utf-8"});
				saveAs(blob, $(this).attr("file"));
				$(this).remove();
			});
		}
		
		setTimeout(checkUpdates, 100);
	}

	var activeChart = null;
	function drawNationalPowerChart(region, title, visibleNation, showInfluence) {
		$.get("https://nationstatesplusplus.net/api/region/wa/?region=" + region, function(data) {
			var categoryTitles = [];
			var endorsements = [];
			var influence = [];
			var playerIndex = -1;
			for (var nation in data) {
				categoryTitles.push(nation);   
			}
			if (showInfluence) {
				var sortNames = function(a, b) {
					return data[b].influence - data[a].influence;
				};
				categoryTitles.sort(sortNames);
			} else {
				var sortNames = function(a, b) {
					return data[b].endorsements - data[a].endorsements;
				};
				categoryTitles.sort(sortNames);
			}
			for (var i = 0; i < categoryTitles.length; i++) {
				var nation = data[categoryTitles[i]];
				endorsements.push(nation.endorsements);
				influence.push(nation.influence);
				if (playerIndex == -1 && categoryTitles[i].toLowerCase().split(" ").join("_") == visibleNation) {
					playerIndex = i;
				}
				categoryTitles[i] = "<b>" + categoryTitles[i] + "</b>";
			}
			if (activeChart != null) {
				activeChart.destroy();
			}
			var series;
			if (showInfluence) {
				series = [{	name: 'Influence', data: influence, color: '#AA4643' },{
							name: 'Endorsements', data: endorsements, color: '#4572A7' }]
			} else {
				series = [{ name: 'Endorsements', data: endorsements, color: '#4572A7' }]
			}
			var container = $('<div>');
			chart = new Highcharts.Chart({
				chart: {
					type: 'bar',
					renderTo: container[0],
					width: $("#" + (showInfluence ? 'influence' : 'power')).width(),
					height: Math.max(300, 100 + (categoryTitles.length * 26 * (showInfluence ? 2 : 1))),
					backgroundColor: 'rgba(255, 255, 255, ' + (isDarkTheme() ? '0.1' : '1.0') + ')'
				},
				title: {
					text: 'World Assembly Endorsements',
					color: (isDarkTheme() ? '#D0D0D0' : '#000000')
				},
				subtitle: {
					text: 'Region: ' + title,
					color: (isDarkTheme() ? '#D0D0D0' : '#000000')
				},
				xAxis: {
					categories: categoryTitles,
					title: {
						text: null
					}
				},
				yAxis: {
					min: 0,
					title: {
						text: 'Endorsements',
						align: 'high'
					},
					labels: {
						overflow: 'justify',
						useHTML: true
					},
				},
				plotOptions: {
					bar: {
						dataLabels: {
							enabled: true
						},
						animation: false
					},
					series: {
						cursor: 'pointer',
						point: {
							events: {
								click: function() {
									var nation = this.category.substring(3, this.category.length - 4);
									var prefix = (window.location.href.startsWith("https://") ? "https:" : "http:");
									window.location.href = prefix + "//www.nationstates.net/nation=" + nation.toLowerCase().split(" ").join("_") + "/detail=wa_stats/stats=" + (showInfluence ? 'influence' : 'power');
								}
							}
						}
					}
				},
				credits: {
					enabled: false
				},
				series: series
			});
			activeChart = chart;
			if (playerIndex > -1) {
				for (var i = 0; i < chart.series.length; i++) {
					chart.series[i].data[playerIndex].update({
						color: "#FF0000"
					});
				}
			}
			setTimeout(function() { $("#snark").remove(); container.appendTo($("#" + (showInfluence ? 'influence' : 'power')));}, 500);
		});
	}

	function updateChartSize(width, height) {
		for (var i = 0; i < Highcharts.charts.length; i++) {
			if (Highcharts.charts[i] != null)
				Highcharts.charts[i].setSize(width, height, true);
		}
	}

	function drawRegionPopulationChart(region, title) {
		$.get("https://nationstatesplusplus.net/api/region/population/?region=" + region, function(data) {
			var populations = [];
			for (var i = data.region.length - 1; i >= 0; i--) {
				var element = [];
				element.push(data.region[i].timestamp);
				element.push(data.region[i].population);
				populations.push(element);
			}
			chart = new Highcharts.Chart({
				chart: {
					type: 'line',
					renderTo: 'regional-pop',
					backgroundColor: 'rgba(255, 255, 255, ' + (isDarkTheme() ? '0.1' : '1.0') + ')'
				},
				title: {
					text: 'Regional Population',
					color: (isDarkTheme() ? '#D0D0D0' : '#000000')
				},
				subtitle: {
					text: title,
					color: (isDarkTheme() ? '#D0D0D0' : '#000000')
				},
				xAxis: {
					dateTimeLabelFormats: {
						month: '%e. %b',
						year: '%b'
					},
					type: 'datetime',
					title: {
						text: null
					}
				},
				yAxis: {
					min: 0,
					title: {
						text: 'Population',
						align: 'high'
					},
					labels: {
						overflow: 'justify',
						useHTML: true
					}
				},
				credits: {
					enabled: false
				},
				series:  [{ name: 'Population', data: populations, color: '#4572A7' }]
			});
		});
	}
})();