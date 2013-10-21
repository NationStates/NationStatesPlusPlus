(function() {
	if (getVisiblePage() == "list_regions" || getVisiblePage() == "tag_search") {
		addRegionFlags();
	}

	if (getVisiblePage() == "list_nations" || getVisiblePage() == "list_regions" || getVisiblePage() == "world" || getVisiblePage() == "tag_search" || getVisiblePage() == "region") {
		setupPageSlider();
	}
	
	function setupPageSlider() {
		var paginator = $('h6[align$="center"]');
		if (paginator.length != 0) {
			var maxPage = 1;
			paginator.children().each(function() {
				if (isNumber($(this).html())) {
					if (parseFloat($(this).html()) > maxPage) {
						maxPage = $(this).html();
					}
				}
			});
			if (maxPage > 1) {
				paginator.attr("align", "");
				paginator.html("<button name='prev-shiny-page' class='button' style='left: 210px; position: absolute; margin-top: -10px;'>Prev Page</button>");
				if (getVisiblePage() == "tag_search") {
					$(getShinyTableSelector()).css("min-width", "99%");
					paginator.html(paginator.html() + "<div id='page-slider' style='text-align: center; width:75%; margin-left:12.5%;' class='noUiSlider'></div>");
				} else if (getVisiblePage() == "region" || getVisibleRegion() == "") {
					if (getVisibleSorting() == "alpha" || window.location.href.contains("un=")) $(getShinyTableSelector()).css("min-width", "98%");
					paginator.html(paginator.html() + "<div id='page-slider' style='text-align: center; width:75%; margin-left:12.5%;' class='noUiSlider'></div>");
				} else {
					$(getShinyTableSelector()).css("min-width", "75%");
					paginator.html(paginator.html() + "<div id='page-slider' style='text-align: center; width:70%; margin-left:100px;' class='noUiSlider'></div>");
				}
				paginator.html(paginator.html() + "<button name='next-shiny-page' class='button' style='right: 20px; position: absolute; margin-top: -10px;'>Next Page</button>");
				addPageSlider(maxPage);
				
				$("button[name='next-shiny-page']").on("click", function(event) {
					event.preventDefault();
					if (shinyRangePage < maxPage - 1) {
						updatePageSlider(shinyRangePage + 1);
						$("button[name='prev-shiny-page']").attr("disabled", false);
					} else if (shinyRangePage == maxPage - 1) {
						updatePageSlider(maxPage);
						$("button[name='next-shiny-page']").attr("disabled", true);
						$("button[name='prev-shiny-page']").attr("disabled", false);
					}
				});
				$("button[name='prev-shiny-page']").on("click", function(event) {
					event.preventDefault();
					if (shinyRangePage > 2) {
						updatePageSlider(shinyRangePage - 1);
						$("button[name='next-shiny-page']").attr("disabled", false);
					} else if (shinyRangePage == 2) {
						updatePageSlider(1);
						$("button[name='prev-shiny-page']").attr("disabled", true);
						$("button[name='next-shiny-page']").attr("disabled", false);
					}
				});
			}
		}
	}
	function getShinyTableSelector() {
		if ($('table[class$="shiny"]').length) return 'table[class$="shiny"]'
		return 'table[class$="shiny ranks"]';
	}

	function addPageSlider(maxPage) {
		var lastSlide = 0;
		$(".noUiSlider").noUiSlider({
			range: [1, maxPage], start: 1, step: 1, handles: 1, slide: function() {
				updatePageSlider($(this).val());
				lastSlide = (new Date()).getTime();
		   }
		});
		$("body").on('keydown', function(e) {
			if (e.which == 37 || e.which == 39) {
				if (lastSlide + 1000 * 10 > (new Date()).getTime()) {
					lastSlide = (new Date()).getTime();
					if (e.which == 39 && ((shinyRangePage + 1) <= maxPage)) {
						updatePageSlider(shinyRangePage + 1);
					} else if (e.which == 37 && ((shinyRangePage - 1) >=  1)) {
						updatePageSlider(shinyRangePage - 1);
					}
				}
			}
		});
		//If we are looking at our own region, and we aren't in the top 10, preserve the extra bottom 3 rows so we can compare ourselves with the other pages
		if (getVisibleRegion() == getUserRegion() && getUserNation() != "" && getVisiblePage() == "region" && $(getShinyTableSelector()).find("tbody").children().length == 13) {
			var html = "";
			$(getShinyTableSelector()).children().children(':last-child').prev('tr').andSelf().each(function() {
				html += "<tr>" + $(this).html() + "</tr>"
			});
			shinyTableBottomRows = html;
		}
		updatePageSlider(1);
	}

	var shinyTableBottomRows;
	var shinyPages = {};
	var shinyRangePage = 1;
	var requestNum = 1;
	//Caches census pages we have already seen
	function updatePageSlider(page) {
		$(".noUiSlider").val(page);
		$("div[id^=handle-id]").html("Page " + page);
		requestNum += 1;
		if (page != shinyRangePage) {
			updateShinyPage(page, requestNum);
			shinyRangePage = page;
		}
	}

	function updateShinyPage(page, request) {
		setTimeout(function() {
			if (request != requestNum) {
				return;
			}
			if (page in shinyPages) {
				doShinyPageUpdate(shinyPages[page]);
			}
			$(getShinyTableSelector()).fadeTo(500, 0.3);
			var pageUrl;
			if (getVisiblePage() == "world") {
				pageUrl = '/page=world?start=' + (page * 10 - 10);
			} else if (getVisiblePage() == "list_nations" && getVisibleRegion() != "") {
				pageUrl = '/page=list_nations/region=' + getVisibleRegion();
				if (getVisibleSorting() != "") {
					pageUrl += "/sort=" + getVisibleSorting();
				}
				pageUrl += '?start=' + (page * 15 - 15);
			} else if (getVisiblePage() == "list_nations") {
				pageUrl = '/page=list_nations'
				if (getVisibleSorting() != "") {
					pageUrl += "/sort=" + getVisibleSorting();
				} else if (window.location.href.contains("un=UN")) {
					pageUrl += "/un=UN";
				} else if (window.location.href.contains("un=DL")) {
					pageUrl += "/un=DL";
				}
				pageUrl += '?start=' + (page * 10 - 10);
			} else if (getVisiblePage() == "tag_search") {
				pageUrl = '/page=tag_search/type=region/'
				if (getVisibleSorting() != "") {
					pageUrl += "/sort=" + getVisibleSorting();
				}
				pageUrl += "/tag=" + getVisibleTag();
				pageUrl += '?start=' + (page * 15 - 15);
			} else if (getVisiblePage() == "list_regions") {
				pageUrl = '/page=list_regions';
				if (getVisibleSorting() != "") {
					pageUrl += "/sort=" + getVisibleSorting();
				}
				pageUrl += '?start=' + (getVisibleSorting() == "alpha" ?  (page * 15 - 15) : (page * 10 - 10));
			} else {
				pageUrl = '/page=display_region/region=' + getVisibleRegion() + '?start=' + (page * 10 - 10);
			}
			$.get(pageUrl, function(data) {
				shinyPages[page] = data;
				doShinyPageUpdate(data);
			});
		}, 250);
	}

	//Adds pretty region flags to census tables 
	function addRegionFlags() {
		$("a.rlink").each(function() {
			if ($(this).find(".smallflag, .miniflag").length > 0) return true;
			var region = $(this).attr("href").substring(7);
			$(this).attr("id", "rflag-" + region);
			$.get("http://capitalistparadise.com/api/regionflag/?region=" + region, function(json) {
				for (var region in json) {
					var flag = json[region];
					if (flag != null && flag.length > 0) {
						var rlink = $("#rflag-" + region);
						rlink.html("<img class='smallflag' src='" + flag + "'>" + rlink.html());
					}
				}
			});
		});
	}

	function doShinyPageUpdate(data) {
		var search = getShinyTableSelector();
		var table = $(search);
		table.html($(data).find(search).html());
		if (getVisiblePage() == "list_regions" || getVisiblePage() == "tag_search") addRegionFlags();
		if (getVisibleRegion() == getUserRegion()) {
			if (shinyRangePage != 1) {
				$(shinyTableBottomRows).insertAfter($(search).children().children(':last-child'));
			}
		}
		table.fadeTo(500, 1);
	}
})();