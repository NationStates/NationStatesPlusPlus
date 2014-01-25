var _gaq = _gaq || [];
function update(delay){
	setTimeout(function() {
		_gaq.push(['_setAccount', 'UA-41267101-1']);
		_gaq.push(['_trackPageview']);
		_gaq.push(['_setCustomVar', 1, 'Version', 'v2.3.0', 2]);

		if (delay == 1) {
			_gaq.push(['_trackEvent', 'NationStates', 'URL', window.location.href]);
		}
		update(60000);
	}, delay);
}
update(1);

(function() {
	//Add string.startsWith
	String.prototype.startsWith = function (str){
		return this.slice(0, str.length) == str;
	};
	//Add string.contains
	String.prototype.contains = function (str){
		return this.indexOf(str) != -1;
	};
	//Add regex escape
	RegExp.escape = function(text) {
		return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
	}
	//Add replaceAll
	String.prototype.replaceAll = function(search, replace) {
		return this.replace(new RegExp(RegExp.escape(search),'g'), replace);
	};

	function getVisibleRegion() {
		var split = window.location.href.split(/[/#/?]/);
		for (var i = 0; i < split.length; i++) {
			if (split[i].startsWith("region=")) {
				return split[i].substring(7).toLowerCase().replaceAll(" ", "_");
			}
		}
		return "";
	}

	function getVisibleNation() {
		return $(".nationname > a").attr("href") ? $(".nationname > a").attr("href").trim().substring(8) : "";
	}

	function getUserNation() {
		if ($(".STANDOUT:first").attr("href")) {
			return $(".STANDOUT:first").attr("href").substring(7);
		}
		return "";
	}

	if (false) {
		if (localStorage.getItem("bugger_off") == null) {
			$(".regional_power").hide();
			$("#content").prepend("<div id='nag_banner' style='width: 100%; background-color: #F00; background-size: 50px 50px;font-size: 40px;font-family: impact;text-align: center;'>Arr, Matey! Interested in helping liberate <a href='/region=osiris'>Osiris</a> from it's tyrant rule? You can help out, learn how!<button style='font-size:30px; padding: 10px; margin: 10px;' class='button' id='help_out'>Sure!</button> <button style='font-size:30px; padding: 10px; margin: 10px;' class='button' id='bugger_off'>Bugger Off</button><span id='show_help' style='display:none;'>You can help rescue Osiris! <ol><li>Move your World Assembly nation to Osiris</li><li>Endorse <a href='/nation=skypheriania'>Skypheriania</a>, the lead liberator!</li></ol>Visit <a href='https://kiwiirc.com/client/irc.esper.net:+6697/?nick=" + getUserNation() + "?#udl'>#UDL</a> to learn more about how the operation works!</span></div>");
			$("#bugger_off").on("click", function(event) {
				event.preventDefault();
				localStorage.setItem("bugger_off", true);
				$("#nag_banner").remove();
			});
			$("#help_out").on("click", function(event) {
				event.preventDefault();
				$("#show_help").show();
			});
		}
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
		$.get("http://capitalistparadise.com/api/region/wa/?region=" + region, function(data) {
			var categoryTitles = [];
			var endorsements = [];
			var influence = [];
			var playerIndex = -1;
			for (var nation in data) {
				categoryTitles.push(nation);   
			}
			var sortNames = function(a, b) {
				return data[b].endorsements - data[a].endorsements;
			};
			categoryTitles.sort(sortNames);
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
					backgroundColor: 'rgba(255, 255, 255, ' + (document.head.innerHTML.indexOf("ns.dark") != -1 ? '0.1' : '1.0') + ')'
				},
				title: {
					text: 'World Assembly Endorsements',
					color: (document.head.innerHTML.indexOf("ns.dark") != -1 ? '#D0D0D0' : '#000000')
				},
				subtitle: {
					text: 'Region: ' + title,
					color: (document.head.innerHTML.indexOf("ns.dark") != -1 ? '#D0D0D0' : '#000000')
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
									window.location.href = "http://www.nationstates.net/nation=" + nation.toLowerCase().split(" ").join("_") + "/detail=wa_stats/stats=" + (showInfluence ? 'influence' : 'power');
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
		$.get("http://capitalistparadise.com/api/region/population/?v=1&region=" + region, function(data) {
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
					backgroundColor: 'rgba(255, 255, 255, ' + (document.head.innerHTML.indexOf("ns.dark") != -1 ? '0.1' : '1.0') + ')'
				},
				title: {
					text: 'Regional Population',
					color: (document.head.innerHTML.indexOf("ns.dark") != -1 ? '#D0D0D0' : '#000000')
				},
				subtitle: {
					text: title,
					color: (document.head.innerHTML.indexOf("ns.dark") != -1 ? '#D0D0D0' : '#000000')
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