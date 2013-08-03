var quote = '<button id="quote-btn-${id}" class="button QuoteButton" onclick="quotePost(this);">Quote</button>';
(function() {
	if (getVisiblePage() == "list_nations" || getVisiblePage() == "list_regions" || getVisiblePage() == "world") {
		setupPageSlider();
	} else if (getVisiblePage() == "region") {
		setupRegionPage(false);
	} else if (getVisiblePage() == "display_region_rmb") {
		setupRegionPage(true);
	}
})();

function toggleIRC(irc) {
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

function setupRegionPage(forumViewPage) {
	if (isSettingEnabled("auto_update")) {
		checkForRMBUpdates(10000);
	}
	
	if (!forumViewPage) {
		if (isSettingEnabled("infinite_scroll")) {
			$(".rmbolder").remove();
		}
	} else {
		$("h6[align='center']").remove();
		$("#toplink").remove();
	}

	var rmbPost = document.forms["rmb"];
	if (typeof rmbPost == 'undefined') {
		quote = "";
	}
	
	if (isAntiquityTheme()) {
		var html = "<tr>" + $("tbody:last").children(":first").html() + "</tr>";
		var children;
		if (isSettingEnabled("infinite_scroll")) {
			children = $("tbody:last").children(":not(:first)").get().reverse();
		} else {
			children = $("tbody:last").children(":not(:first)").get();
		}
		$(children).each( function() {
			html += parseRMBPost($(this).html(), quote, $(this).attr('class'));
		});
		$("tbody:last").html(html);
	} else {
		var html = "";
		var children;
		if (isSettingEnabled("infinite_scroll")) {
			children = $(".rmbtable2").children().get().reverse();
		} else {
			children = $(".rmbtable2").children().get();
		}
		$(children).each( function() {
			html += parseRMBPost($(this).html(), quote, $(this).attr('class'));
		});
		$(".rmbtable2").html(html);
	
		$(".small").attr("class", "button");
		$(".hilite").attr("class", "button");
	}

	if (isSettingEnabled("infinite_scroll") || isSettingEnabled("search_rmb")) {
		var formHtml = "<div id='rmb-post-form' style='display: none;'><div style='text-align:center;'><p>You need to " + (getUserNation().length > 0 ?  "move to the region" : "login to NationStates") + " first!</p></div></div>";
		//Move the RMB reply area to the top
		if (typeof rmbPost != 'undefined') {
			//Remove the "From:" line
			$(rmbPost).children().each( function() {
				if ($(this).html().indexOf("From:") > -1) {
					$(this).remove();
				}
			});

			//Move the post form to the top
			var formHtml = "<div id='rmb-post-form' " + (forumViewPage || !isSettingEnabled("search_rmb") ? "" : "style='display: none;'") + "><form onsubmit='rmbpost(); return false;' id='rmb'>" + rmbPost.innerHTML + "</form></div>";
			$(rmbPost).remove();
		}
		var widebox = $('.widebox:last');
		widebox.prepend(formHtml);
	} else {
		//Override older rmb click
		$('#olderrmb').unbind("click").click(function(event){
			event.preventDefault();
			$('.rmbolder .notloading').hide();
			$('.rmbolder .loading').show();
			$.get('/page=ajax/a=rmb/region=' + getVisibleRegion() + '/offset=' + rmboffset, function(data) {
				rmboffset += 10;
				if (data.length > 1) {
					var html = "";
					$(data).each( function() {
						var postId = getRMBPostId($(this).html());
						var rmbPost = document.getElementById("rmb-post-" + postId);
						if (rmbPost === null) {
							html += parseRMBPost($(this).html(), quote, $(this).attr('class'));
						}
					});
					$(html).insertBefore('.rmbrow:first').hide().show('slow');
				} else {
					$('.rmbolder').text("At Earliest Message");
				}
				$('.rmbolder .loading').hide();
				$('.rmbolder .notloading').show();
			});
        });
	}
	
	//Forum view has old/bad buttons, have to fix them
	if (forumViewPage && typeof rmbPost != 'undefined') {
		$('[name="lodge_message"]').attr("class", "button icon approve primary");
		$('[name="lodge_message"]').attr("value", "1");
		$('[name="lodge_message"]').changeElementType("button");
		$('[name="lodge_message"]').html("Lodge Message");
		$('[name="preview"]').attr("class", "previewbutton button search icon");
		$('[name="preview"]').removeAttr("value");
		$('[name="preview"]').changeElementType("button");
		$('[name="preview"]').html("Preview");
	}

	//Move "Switch to Forum View" to top of RMB posts
	if (isSettingEnabled("infinite_scroll")) {
		if (isAntiquityTheme()) {
			var forumView = $('.rmbview');
			var forumViewHTML = forumView.html();
			forumView.remove();
			$("<p class='rmbview'>" + forumViewHTML + "</p>").insertBefore(".shiny.rmbtable");
		} else {
			var forumView = $('#content').find('.rmbview');
			var forumViewHTML = forumView.html();
			forumView.remove();
			$("<p class='rmbview'>" + forumViewHTML + "</p>").insertBefore(".rmbtable2:first");
		}
	} else if (isSettingEnabled("search_rmb")) {
		$('.rmbolder').css("margin-top", "20px");
	}

	//Setup infinite scroll
	$(window).scroll(handleInfiniteScroll);
	
	if (forumViewPage) {
		return;
	}

	if (isSettingEnabled("search_rmb")) {
		//Add search box
		widebox.prepend("<div id='searchbox' style='display: none;'><div style='margin-top:6px; text-align:center;'><input id='rmb-search-input' placeholder='Search' type='search' style='width:35%; height:25px;' name='googlesearch' onkeydown='if (event.keyCode == 13) { searchRMB(); } else { updateSearchText(); }'><p><input id='rmb-search-input-region' placeholder='Region' type='search' style='width:16.5%; margin-right: 2%; height:25px;' name='googlesearch' onkeydown='if (event.keyCode == 13) { searchRMB(); }'><input id='rmb-search-input-author' placeholder='Author' type='search' style='width:16.5%; height:25px;' name='googlesearch' onkeydown='if (event.keyCode == 13) { searchRMB(); }'><p></div></div>");

		//Add rmb menu area
		widebox.prepend("<div id='rmb-menu' style='text-align: center;'><button class='button RoundedButton' onclick='toggleRMBPostForm();'>Leave a message</button> <button class='button RoundedButton' onclick='toggleSearchForm();'>Search messages</button></div");
		
		if (isAntiquityTheme()) {
			$("#rmb-menu").css("margin-bottom", "20px");
			$("#rmb-search-input").css("margin-bottom", "20px");
		}
	}

	//Replace census slider
	setupPageSlider();
}

function isForumView() {
	return window.location.href.indexOf("/page=display_region_rmb") != -1;
}

function rmbpost() {
	var $form = $( this ),
		chkValue = $('input[name="chk"]').val(),
		messageValue = $('textarea[name="message"]').val(),
		url = "/page=lodgermbpost/region=" + getVisibleRegion();

	var posting = jQuery.ajax({
		type: "POST",
		url: url,
		data: $(document.forms["rmb"]).serialize(),
		dataType: "html",
		contentType: "application/x-www-form-urlencoded;",
		beforeSend: function(jqXHR) {
			jqXHR.overrideMimeType('text/html;');
		}
	});

	$("#rmb-post-form").animate({ height: 'toggle' }, 1200, function() { $(this).hide(); });
	//Have to reopen the form for the Forum View
	if (isForumView()) {
		$("#rmb-post-form").animate({ height: 'toggle' }, 1200, function() { $(this).show(); });
	}
	posting.done(function( data ) {
		var error = ($(data).find("p[class='error']")).text();
		if (typeof error != 'undefined' && error.length > 0) {
			console.log("Error: " + error);
			alert(error);
			return;
		}
		$.get('/region=' + getVisibleRegion(), function(data) {
			if (isForumView()) {
				$("#rmb").html($(data).find("#rmb:last").html());
			} else {
				$("#rmb").html($(data).find("#rmb").html());
			}
			$('textarea[name="message"]').val("");
			updateRMB();
		});
	});
}

function getShinyTableSelector() {
	if ($('table[class$="shiny"]').length) return 'table[class$="shiny"]'
	return 'table[class$="shiny ranks"]';
}

function setupPageSlider() {
	if (!isSettingEnabled("scroll_nation_lists")) {
		console.log("nation list disabled");
		return;
	}
	var census = $('h6[align$="center"]');
	if (typeof census.html() != 'undefined') {
		var maxPage = 1;
		census.children().each(function() {
			if (isNumber($(this).html())) {
				if (parseFloat($(this).html()) > maxPage) {
					maxPage = $(this).html();
				}
			}
		});
		if (maxPage > 1) {
			census.attr("align", "");
			if (getVisiblePage() == "region" || getVisibleRegion() == "") {
				if (getVisibleSorting() == "alpha" || window.location.href.contains("un=")) $(getShinyTableSelector()).css("min-width", "98%");
				census.html("<div id='page-slider' style='text-align: center; width:75%; margin-left:12.5%;' class='noUiSlider'></div>");
			} else {
				$(getShinyTableSelector()).css("min-width", "75%");
				census.html("<div id='page-slider' style='text-align: center; width:73%; margin-left:1%;' class='noUiSlider'></div>");
			}
			addPageSlider(maxPage);
		}
	}
}

//Seems that for some reason noUiSlider plugin loads slowly, so need to be able to fail and retry
function addPageSlider(maxPage) {
	try {
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
		if (getVisibleRegion() == getUserRegion()) {
			var html = "";
			$(getShinyTableSelector()).children().children(':last-child').prev('tr').andSelf().each(function() {
				html += "<tr>" + $(this).html() + "</tr>"
			});
			shinyTableBottomRows = html;
		}
		updatePageSlider(1);
	} catch (e) {
		setTimeout(function() { addPageSlider(maxPage); }, 25);
	}
}

var shinyTableBottomRows;
var shinyPages = {};
var shinyRangePage = 1;
var requestNum = 1;
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

function doShinyPageUpdate(data) {
	var search = getShinyTableSelector();
	var table = $(search);
	table.html($(data).find(search).html());
	if (getVisibleRegion() == getUserRegion()) {
		if (shinyRangePage != 1) {
			$(shinyTableBottomRows).insertAfter($(search).children().children(':last-child'));
		}
	}
	table.fadeTo(500, 1);
}

var keywords;
var lastSearchSuccessful = false;
var searchOffset = 0;
var cancelled = false;
function searchRMB() {
	var searchWords = document.getElementById("rmb-search-input").value;
	_gaq.push(['_trackEvent', 'RMB', 'Search', searchWords]);
	keywords = searchToKeywords(searchWords);
	//Hide RMB
	var rmb = $('.rmbtable2:last');
	var searchResults = document.getElementById("rmb-search-results");
	if (searchResults === null) {
		$("<div id='rmb-search-results' style='display: block;' class='rmbtable2'></div>").insertBefore(rmb);
		searchResults = document.getElementById("rmb-search-results");
		$(searchResults).html("<p></p>");
		$(searchResults).attr("style", "display: block; height: " + rmb.height() + "px;");
	} else {
		$(searchResults).attr("style", "display: block; height: " + rmb.height() + "px;");
		$(searchResults).html("<p></p>");
	}
	rmb.attr("style", "display: none;");
	cancelled = false;
	searchOffset = 0;
	doRMBSearch();
}

/**
	Converts a search input into an array of keywords to search for.
	Each word separated by one or more spaces is considered a keyword,
	Unless the text is inside a pair of ""'s.
*/
function searchToKeywords(search) {
	var keys = new Array();
	var start = 0;
	var foundQuote = false;
	for (var i = 0, len = search.length; i < len; i++) {
		if (search[i] == '"') {
			if (!foundQuote) {
				foundQuote = true;
			} else {
				foundQuote = false;
				keys.push(search.substring(start + 1, i).trim());
				start = i + 1;
			}
		} else if (search[i] == " " && !foundQuote) {
			if (i != start) {
				keys.push(search.substring(start, i).trim());
			}
			start = i + 1;
		}
	}
	var lastKey;
	if (foundQuote) {
		lastKey = search.substring(start + 1).trim();
	} else {
		lastKey = search.substring(start).trim();
	}
	if (lastKey.length > 0) {
		keys.push(lastKey);
	}
	return keys;
}

function updateSearchText() {
	cancelled = true;
	var tooltip = false;
	var searchBox = $("#rmb-search-input");
	var words = searchToKeywords(searchBox.val());
	for (var i in words) {
		var keyword = words[i];
		if (keyword != null && keyword.length <= 3) {
			$("#rmb-search-input").attr("title", "Words shorter than 4 letters long are ignored");
			tooltip = true;
			break;
		}
	}
	if (!tooltip) {
		$("#rmb-search-input").removeAttr("title");
	}
}

function doRMBSearch() {
	cancelled = false;
	var input = $("#rmb-search-input").val();
	var region = getVisibleRegion();
	var author = "*";
	if ($("#rmb-search-input-region").val() != "") {
		region = $("#rmb-search-input-region").val();
	}
	if ($("#rmb-search-input-author").val() != "") {
		author = $("#rmb-search-input-author").val();
	}
	$.get('/page=ajax/a=rmbsearch/rmbsearch-text=' + encodeURIComponent(input) + (region == "*" ? "" : '/rmbsearch-region=' + region) + (author == "*" ? "" : '/rmbsearch-author=' + author) + '/rmbsearch-offset=' + searchOffset, function(data) {
		if (cancelled) {
			return;
		}
		
		var searchResults = $("#rmb-search-results");
		if (data.length > 14) {
			//Process RMB posts
			$($(data).children()).each( function() {
				var searchResult = $(searchResults).append(parseRMBPostWithId($(this).html(), quote, $(this).attr('class'), getRMBPostId($(this).html()) + "-search"));
				for (var i in keywords) {
					var keyword = keywords[i];
					if (keyword != null && keyword.length > 3) {
						$(searchResult).highlight(keyword);
					}
				}
			});
			$(searchResults).attr("style", "display: block;");
			searchOffset += 20;
			lastSearchSuccessful = true;
			$(searchResults).append("<div id='end-of-search-results' class='rmbolder'>End of Search Results</div>");
		} else if (searchOffset > 0) {
			$(searchResults).append("<div class='rmbolder'>End of Search Results</div>");
			lastSearchSuccessful = true;
		} else {
			$(searchResults).append("<div class='rmbolder'>No Search Results</div>");
			lastSearchSuccessful = false;
		}
	});
}

function isRMBPostFormVisible() {
	return ($("#rmb-post-form").attr("style") == "");
}

function toggleRMBPostForm() {
	if ($("#rmb-post-form").attr("style") == "") {
		$("#rmb-post-form").attr("style", "display: none;");
	} else {
		$("#rmb-post-form").attr("style", "");
	}
	$("#searchbox").attr("style", "display: none;");
	//Hide search results
	var searchResults = document.getElementById("rmb-search-results");
	if (searchResults != null) {
		$(searchResults).attr("style", "display: none;");
	}
	//Show RMB posts
	$('.rmbtable2:last').attr("style", "display: block;");
}

function isSearchFormVisible() {
	return ($("#searchbox").attr("style") == "");
}

function isSearchResultsVisible() {
	var results = document.getElementById("rmb-search-results");
	if (results != null) {
		return $(results).attr("style") != "display: none;";
	}
	return false;
}

function toggleSearchForm() {
	if ($("#searchbox").attr("style") == "") {
		$("#searchbox").attr("style", "display: none;");
	} else {
		$("#searchbox").attr("style", "");
	}
	$("#rmb-post-form").attr("style", "display: none;");
	var searchResults = document.getElementById("rmb-search-results");
	if (searchResults != null && lastSearchSuccessful) {
		$(searchResults).attr("style", "display: block;");
		$('.rmbtable2:last').attr("style", "display: none;");
	}
	$("#rmb-search-input").focus();
}

function isAtBottomOfPage() {
	if (isAntiquityTheme()) {
		return isInRange($(window).scrollTop() - 5, $(window).height(), $(window).scrollTop() + 800)
	}
	return isInRange($(window).scrollTop() - 5, $(document).height() - $(window).height(), $(window).scrollTop() + (screen.height / 2.5));
}

var atEarliestMessage = false;
var rmboffset = 10;
var lastRMBScroll = (new Date()).getTime();
function handleInfiniteScroll() {
	if (atEarliestMessage) {
		return;
	}
	if (!isAtBottomOfPage()) {
		return;
	}
	if (lastRMBScroll + 100 > (new Date()).getTime()) {
		return;
	}
	//Infinite search Scroll
	if (isSearchResultsVisible()) {
		var searchPaused = document.getElementById("end-of-search-results");
		if (searchPaused != null) {
			$(searchPaused).remove();
			doRMBSearch();
		}
	} else if (isSettingEnabled("infinite_scroll")) {
		//Infinite RMB post scroll
		getRMBPosts(rmboffset, function(data) {
			if (data.length > 1) {
				//Format HTML
				var html = "";
				$($(data).get().reverse()).each( function() {
					var postId = getRMBPostId($(this).html());
					var rmbPost = document.getElementById("rmb-post-" + postId);
					if (rmbPost === null) {
						html += parseRMBPost($(this).html(), quote, $(this).attr('class'));
					}
				});
				$(html).insertAfter('.rmbrow:last').hide().show('slow');
			} else if (!atEarliestMessage) {
				atEarliestMessage = true;
				$("<div class='rmbolder'>At Earliest Message</div>").insertAfter('.rmbrow:last').hide().show('slow');
			}
		});
		rmboffset += 10;
		lastRMBScroll = (new Date()).getTime();
	}
}

var lastRMBUpdate = (new Date()).getTime();
function checkForRMBUpdates(delay){
	setTimeout(function() {
		if (!isSearchResultsVisible()) {
			//Should we get an update?
			var updateDelay = 10000; //10 sec
			if (!isPageActive()) {
				updateDelay = 300000; //5 min
			} else if (getLastActivity() + 60000 < Date.now()) {
				updateDelay = 150000; //2.5 min
			}
			if (Date.now() > (lastRMBUpdate + updateDelay)) {
				lastRMBUpdate = (new Date()).getTime();
				updateRMB();
			}
		}
		checkForRMBUpdates(10000);
	}, delay);
}

function updateRMB() {
	//update RMB
	$.get('/page=ajax/a=rmb/region=' + getVisibleRegion() + '/offset=0', function(data) {
		if (data.length > 1 && !isSearchResultsVisible()) {
			var html = "";
			//Check for new posts
			$($(data).get().reverse()).each( function() {
				var postId = getRMBPostId($(this).html());
				var rmbPost = document.getElementById("rmb-post-" + postId);
				if (rmbPost === null) {
					html += parseRMBPost($(this).html(), quote, $(this).attr('class'));
				} else {
					//Update timestamps
					if ($(rmbPost).find(".rmbdate").html() != "undefinied") {
						$(rmbPost).find(".rmbdate").html($(this).find(".rmbdate").html());
					}
				}
			});
			//Insert new posts
			if (html.length > 0) {
				if (isSettingEnabled("infinite_scroll") || isSettingEnabled("search_rmb")) {
					$(html).insertBefore('.rmbrow:first').hide().show('slow');
				} else {
					$(html).insertAfter('.rmbrow:last').hide().show('slow');
				}
			}
		}
	});
}

var rmbCache = {};
function getRMBPosts(offset, callback) {
	if (offset in rmbCache) {
		callback(rmbCache[offset]);
	} else {
		$.get('/page=ajax/a=rmb/region=' + getVisibleRegion() + '/offset=' + offset, function(data) {
			rmbCache[offset] = data;
			callback(rmbCache[offset]);
		});
	}
}

function getRMBPostId(html) {
	var startIndex = html.indexOf("/page=rmb/postid=") + "/page=rmb/postid=".length;
	var endIndex = html.indexOf('"', startIndex);
	var postId = html.substring(startIndex, endIndex);
	return postId;
}

function parseRMBPost(innerHTML, quoteHTML, className) {
	return parseRMBPostWithId(innerHTML, quoteHTML, className, getRMBPostId(innerHTML));
}

function parseRMBPostWithId(innerHTML, quoteHTML, className, postId) {
	if (innerHTML.indexOf("rmbsuppressed") > -1 || innerHTML.indexOf(quoteHTML) > -1 || !isSettingEnabled("show_quote")) {
		quoteHTML = "";
	} else {
		quoteHTML = quoteHTML.replace("${id}", postId);
	}

	if (isSettingEnabled("clickable_links")) {
		innerHTML = linkify(innerHTML);
	}

	//Add inner body div
	var innerBody = innerHTML.indexOf('<div class="rmbspacer"></div>');
	if (localStorage.getItem("ignored-post-" + postId) == "true") {
		innerHTML = "<div id='rmb-inner-body-" + postId + "' style='display:none;'>" + innerHTML.substring(0, innerBody) + "</div>" + innerHTML.substring(innerBody);
	} else {
		innerHTML = "<div id='rmb-inner-body-" + postId + "'>" + innerHTML.substring(0, innerBody) + "</div>" + innerHTML.substring(innerBody);
	}

	//Add ignore button
	if (isSettingEnabled("show_ignore")) {
		if (postId.indexOf("-search") == -1 && innerHTML.indexOf('div class="rmbbuttons">') == -1 && innerHTML.indexOf('class="rmbsuppressed"') == -1) {
				innerHTML = '<div style="margin-top:6px;" class="rmbbuttons"><a href="" class="forumpaneltoggle rmbignore"><img src="http://capitalistparadise.com/nationstates/static/rmb_ignore.png" alt="Ignore" title="Ignore Post"></a></div>' + innerHTML;
		}
		
		if (localStorage.getItem("ignored-post-" + postId) == "true") {
			innerHTML += "<div id='rmb-ignored-body-" + postId + "' class='rmbsuppressed' style='margin-top:-16px; padding-bottom:6px;'>Ignored post.</div>";
			quoteHTML = "";
		}
	}
	
	if (isAntiquityTheme()) {
		var index = innerHTML.lastIndexOf("</td>");
		innerHTML = innerHTML.substring(0, index) + quoteHTML + "</td>" + innerHTML.substring(index + 4);
		return ("<tr id='rmb-post-" + postId + "' class='" + className + "'>" + innerHTML + "</tr>");
	}
	return ("<div id='rmb-post-" + postId + "' class='" + className + "' style='display: block;'>" + innerHTML + quoteHTML + "</div>");
}

//Ignore post click handler
$('body').on('click', 'a.rmbignore', function(event) {
	event.preventDefault();
	var postId = $(this).parents('.rmbrow').attr('class').split('post-')[1];
	
	$('#quote-btn-' + postId).animate({width: 'toggle'}, 250);
	$('#rmb-inner-body-' + postId).animate({height: 'toggle'}, 500);
	if (typeof $("#rmb-ignored-body-" + postId).html() == 'undefined') {
		$(this).parents('.rmbrow').append("<div id='rmb-ignored-body-" + postId + "' class='rmbsuppressed' style='margin-top:-16px; padding-bottom:6px;'>Ignored post.</div>");
		localStorage.setItem("ignored-post-" + postId, "true");
	} else {
		$("#rmb-ignored-body-" + postId).remove();
		localStorage.removeItem("ignored-post-" + postId);
		if (typeof $('#quote-btn-' + postId).html() == 'undefined') {
			$(this).parents('.rmbrow').append(quote.replace("${id}", postId));
		}
	}
});

function quotePost(post) {
	//Show RMB if it is hidden
	if (!isRMBPostFormVisible()) {
		toggleRMBPostForm();
	}
	var postId = $(post).attr("id").split("quote-btn-")[1];
	var nation = "";
	var author;
	if (isAntiquityTheme()) {
		author = $("#rmb-post-" + postId).children()[1];
	} else {
		author = $("#rmb-inner-body-" + postId).children(".rmbauthor2");
	}
	
	var fullName = $(author).find("a").attr("href");
	if (typeof fullName == 'undefined') {
		nation = "[b]" + $(author).html() + "[/b]";
	} else if (fullName.indexOf("page=help") > -1) {
		nation = "[b]NationStates Moderators[/b]";
	} else if (fullName.indexOf("page=rmb") > -1) {
		nation = "[b]" + $(author).find("p").html() + "[/b]";
	} else {
		nation = "[nation]" + fullName.substring(7) + "[/nation]";
	}
	
	var message;
	if (isAntiquityTheme()) {
		message = $("#rmb-post-" + postId).children()[2];
	} else {
		message = $("#rmb-inner-body-" + postId).children(".rmbmsg2");
	}
	
	var text = "";
	//TODO: make this less horrible
	$(message).children().each(function() {
		if ($(this).html().indexOf("rmbbdelete.png") == -1) {
			if ($(this).get(0).tagName == "BUTTON") {
				return;
			}
			if (text.length > 0) {
				text += "\n\n";
			}
			if (this.children.length == 0) {
				text += $(this).html();
			} else {
				$(this).contents().each(function() {
					if (typeof $(this).attr("href") != 'undefined') {
						if ($(this).attr("href").indexOf("nation=") > -1) {
							var nationName = $(this).attr("href").substring(7);
							text += "[nation";
							var shortName = $(this).html().toLowerCase().indexOf("<span>" + nationName.split("_").join(" ") + "</span>") > -1;
							var noFlag = (typeof $(this).parent().find("img[class='miniflag']").html() == 'undefined');
							if (shortName && noFlag) {
								text += "=short+noflag]";
							} else if (shortName) {
								text += "=short]";
							} else if (noFlag) {
								text += "=noflag]";
							} else {
								text += "]";
							}
							text += nationName + "[/nation]"
						} else if ($(this).attr("href").indexOf("region=") > -1) {
							var regionName = $(this).attr("href").substring(8);
							text += "[region]" + regionName.split("_").join(" ").toTitleCase() + "[/region]";
						}
					} else {
						text += $(this).text();
					}
				});
			}
		}
	});

	var form = document.forms["rmb"];
	var widebox = $(form).children(".widebox");
	$(widebox).attr("id","widebox-form");
	var textArea = $(widebox).find("textarea");
	var value = $(textArea).val();
	if (value.length > 0) {
		value += "\n";
	}
	value += "[b]>[/b] " + nation + " said:\n";
	value += "[i]" + text + "[/i]";
	$(textArea).val(value + "\n\n");
	$('body,html').animate({scrollTop: $("#widebox-form").offset().top - 100});
	$(textArea).focus();
	$(textArea).caretToEnd();
}