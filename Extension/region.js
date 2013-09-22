var quote = '<button id="quote-btn-${id}" class="button QuoteButton" onclick="quotePost(this);">Quote</button><a href="javascript:void(0)" class="QuoteButton rmbcomment" id="view-comment-link-${id}" style="margin-right: 5px; display:none;">View Comments</a><a href="javascript:void(0)" class="QuoteButton rmbcomment" id="comment-link-${id}" style="margin-right: 5px; display:none;">Add Comment</a><a href="javascript:void(0)" class="QuoteButton rmbcomment-submit" id="submit-comment-link-${id}" style="margin-right: 5px; display:none;">Submit</a><a href="javascript:void(0)" class="QuoteButton rmbcomment-cancel" id="cancel-comment-link-${id}" style="display:none;">Cancel</a><textarea id="comment-rmb-${id}" style="width: 100%; height: 8em; display:none;" wrap="soft"></textarea>';
(function() {
	if (getVisiblePage() == "region" || getVisiblePage() == "display_region") {
		setupRegionPage(false);
	} else if (getVisiblePage() == "display_region_rmb") {
		setupRegionPage(true);
	}
})();

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
	}
	if (!isSettingEnabled("infinite_scroll")) {
		//Override older rmb click
		var olderRMB = $('#olderrmb').prop('outerHTML')
		var olderParent = $('#olderrmb').parent();
		$('#olderrmb').remove();
		olderParent.append(olderRMB.replaceAll("olderrmb", "older_rmb"));
		console.log("unbound event handlers 2");
		$('#older_rmb').click(function(event){
			event.preventDefault();
			console.log("RMB Processing: " + processingRMB);
			if (processingRMB) {
				return;
			}
			processingRMB = true;
			$('.rmbolder .notloading').hide();
			$('.rmbolder .loading').show();
			request = $.get('/page=ajax/a=rmb/region=' + getVisibleRegion() + '/offset=' + _rmboffset, function(data) {
				_rmboffset += 10;
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
			});
			request.fail(function() {
				console.log("RMB Request Failed!");
			});
			request.always(function() {
				processingRMB = false;
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

	addFormattingButtons();
}

function addFormattingButtons() {
	$(".nscodedesc").find("abbr").each(function() {
		var text = $(this).html().substring(1, $(this).html().length - 1);
		$(this).html(text);
		if (text.length > 1) {
			$(this).css("width", "53px");
		} else {
			$(this).css("width", "23px");
		}
		if (text == "b") {
			$(this).attr("id", "bold_format");
			$(this).css("font-weight", "bold");
			$(this).html(text.toUpperCase());
		} else if ($(this).html() == "i") {
			$(this).attr("id", "italic_format");
			$(this).css("font-style", "italic");
		} else if ($(this).html() == "u") {
			$(this).attr("id", "underline_format");
			$(this).css("text-decoration", "underline");
		} else if ($(this).html() == "nation") {
			$(this).attr("id", "nation_format");
			$(this).html("<option>nation</option><option>nation=short</option><option>nation=noflag</option><option>nation=short+noflag</option>");
			$(this).css("width", "143px");
			$(this).changeElementType("select");
			return true;
		} else if ($(this).html() == "region") {
			$(this).attr("id", "region_format");
		}
		$(this).attr("class", "forum_bbcode_button");
		$(this).changeElementType("button");
	});
	$("#bold_format").on("click", formatBBCode);
	$("#italic_format").on("click", formatBBCode);
	$("#underline_format").on("click", formatBBCode);
	$("#nation_format").on("change", formatBBCode);
	$("#nation_format").on("select", formatBBCode);
	$("#region_format").on("click", formatBBCode);
}

function formatBBCode(event) {
	event.preventDefault();
	var value = ($(this).html().contains("<option>") ? $(this).val() : $(this).html());
	getRMBTextArea().wrap_selection("[" + value + "]", "[/" + value.split("=")[0] + "]");
}

function getRMBTextArea() {
	var form = document.forms["rmb"];
	var widebox = $(form).children(".widebox");
	$(widebox).attr("id","widebox-form");
	var textArea = $(widebox).find("textarea");
	return textArea;
}

function isForumView() {
	return window.location.href.indexOf("/page=display_region_rmb") != -1;
}

function toWindows1252(string, replacement) {
    var ret = new Array(string.length);    
    var i, ch;

    replacement = typeof replacement === "string" && replacement.length > 0 ? replacement.charCodeAt(0) : 0;

    for (i = 0; i < string.length; i++) {
		ch = string.charCodeAt(i);
        if (ch <= 0x7F || (ch >= 0xA0 && ch <= 0xFF)) {
            ret[i] = ch;
        } else {
            ret[i] = toWindows1252.table[string[i]];
            if (typeof ret[i] === "undefined") {
                ret[i] = replacement;
            }
        }
    }

    return ret;
}

toWindows1252.table = {
    '\x81': 129, '\x8d': 141, '\x8f': 143, '\x90': 144, 
    '\x9d': 157, '\u0152': 140, '\u0153': 156, '\u0160': 138, 
    '\u0161': 154, '\u0178': 159, '\u017d': 142, '\u017e': 158, 
    '\u0192': 131, '\u02c6': 136, '\u02dc': 152, '\u2013': 150, 
    '\u2014': 151, '\u2018': 145, '\u2019': 146, '\u201a': 130, 
    '\u201c': 147, '\u201d': 148, '\u201e': 132, '\u2020': 134, 
    '\u2021': 135, '\u2022': 149, '\u2026': 133, '\u2030': 137, 
    '\u2039': 139, '\u203a': 155, '\u20ac': 128, '\u2122': 153
};

function d2h(d) {return d.toString(16);}

function encodeRMBPost(message) {
	var chars = toWindows1252(message);
	var result = "";
	for (var i = 0; i < chars.length; i++) {
		if (chars[i] > 16) {
			result += "%" + d2h(chars[i]);
		} else {
			result += String.fromCharCode(chars[i]);
		}
	}
	return result;
}

function rmbpost() {
	var $form = $( this ),
		chkValue = $('input[name="chk"]').val(),
		messageValue = $('textarea[name="message"]').val(),
		url = "/page=lodgermbpost/region=" + getVisibleRegion();

	var posting = jQuery.ajax({
		type: "POST",
		url: url,
		data: "chk=" + chkValue + "&message=" + encodeRMBPost(messageValue) + "&lodge_message=1",
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
			$("#previewcontent").html("");
			updateRMB();
		});
	});
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
	console.log("Searching for: " + searchWords);
	doRMBSearch();
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
		region = $("#rmb-search-input-region").val().replaceAll(" ", "_");
	}
	if ($("#rmb-search-input-author").val() != "") {
		author = $("#rmb-search-input-author").val().replaceAll(" ", "_");
	}
	var page = '/page=ajax/a=rmbsearch/rmbsearch-text=' + encodeURIComponent(input) + (region == "*" ? "" : '/rmbsearch-region=' + region) + (author == "*" ? "" : '/rmbsearch-author=' + author) + '/rmbsearch-offset=' + searchOffset;
	$.get(page, function(data) {
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
			console.log("Partial search result for : " + page);
			$(searchResults).append("<div id='end-of-search-results' class='rmbolder'>End of Search Results</div>");
		} else if (searchOffset > 0) {
			console.log("Full search result for : " + page);
			$(searchResults).append("<div class='rmbolder'>End of Search Results</div>");
			lastSearchSuccessful = true;
		} else {
			console.log("No search result for : " + page);
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

var processingRMB = false;
var atEarliestMessage = false;
var _rmboffset = 10;
var lastRMBScroll = (new Date()).getTime();
function handleInfiniteScroll() {
	if (atEarliestMessage) {
		return;
	}
	if (!isAtBottomOfPage()) {
		return;
	}
	if (lastRMBScroll + 100 > Date.now()) {
		return;
	}
	//Infinite search Scroll
	if (isSearchResultsVisible()) {
		var searchPaused = document.getElementById("end-of-search-results");
		if (searchPaused != null) {
			$(searchPaused).remove();
			doRMBSearch();
		}
	} else if (isSettingEnabled("infinite_scroll") && !processingRMB) {
		processingRMB = true;
		lastRMBScroll = Date.now();
		console.log("Processing");
		//Infinite RMB post scroll
		var request = $.get('/page=ajax/a=rmb/region=' + getVisibleRegion() + '/offset=' + _rmboffset, function(data) {
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
			_rmboffset += 10;
			console.log("Loaded RMB");
		});
		request.fail(function() {
			console.log("RMB Request Failed!");
		});
		request.always(function() {
			processingRMB = false;
		});
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
				if ($(this).find(".rmbsuppressed").length == 0) {
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
		quoteHTML = quoteHTML.replaceAll("${id}", postId);
	}

	if (isSettingEnabled("clickable_links")) {
		innerHTML = linkify(innerHTML);
	}

	//Add inner body div
	var innerBody = innerHTML.indexOf('<div class="rmbspacer"></div>');

	var isPostVisible = postId.indexOf("-search") == -1 && innerHTML.indexOf('rmbbuttons') == -1 && innerHTML.indexOf('rmbsuppressed') == -1;
	if (isPostVisible && localStorage.getItem("ignored-post-" + postId) == "true" && isSettingEnabled("show_ignore")) {
		innerHTML = "<div id='rmb-inner-body-" + postId + "' style='display:none;'>" + innerHTML.substring(0, innerBody) + "</div>" + innerHTML.substring(innerBody);
	} else {
		innerHTML = "<div id='rmb-inner-body-" + postId + "'>" + innerHTML.substring(0, innerBody) + "</div>" + innerHTML.substring(innerBody);
	}

	if (isPostVisible && isSettingEnabled("show_ignore")) {
		//Add ignore button
		innerHTML = '<div style="margin-top:6px;" class="rmbbuttons"><a href="" class="forumpaneltoggle rmbignore"><img src="http://capitalistparadise.com/nationstates/static/rmb_ignore.png" alt="Ignore" title="Ignore Post"></a></div>' + innerHTML;

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

$('body').on('click', 'a.rmbcomment', function(event) {
	event.preventDefault();
	var split = $(this).attr('id').split('-');
	var postId = split[split.length - 1];
	
	console.log("Open comment");
	
	$("#comment-link-" + postId).hide();
	$("#submit-comment-link-" + postId).show();
	$("#cancel-comment-link-" + postId).show();
	$("#comment-rmb-" + postId).hide().animate({height: 'toggle'}, 500);
});

$('body').on('click', 'a.rmbcomment-submit', function(event) {
	event.preventDefault();
	var split = $(this).attr('id').split('-');
	var postId = split[split.length - 1];
	
	console.log("Submitting comment: " + $("#comment-rmb-" + postId).val());
	
	$("#comment-link-" + postId).show();
	$("#submit-comment-link-" + postId).hide();
	$("#cancel-comment-link-" + postId).hide();
	$("#comment-rmb-" + postId).show().animate({height: 'toggle'}, 500);
});

$('body').on('click', 'a.rmbcomment-cancel', function(event) {
	event.preventDefault();
	var split = $(this).attr('id').split('-');
	var postId = split[split.length - 1];
	
	console.log("Cancelling comment");
	
	$("#comment-link-" + postId).show();
	$("#submit-comment-link-" + postId).hide();
	$("#cancel-comment-link-" + postId).hide();
	$("#comment-rmb-" + postId).val("");
	$("#comment-rmb-" + postId).show().animate({height: 'toggle'}, 500);
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
		nation = "[nation=short]" + fullName.substring(7) + "[/nation]";
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
	
	text = $("<div></div>").html(text).text();

	var textArea = getRMBTextArea();
	var value = $(textArea).val();
	if (value.length > 0) {
		value += "\n";
	}
	value += "[b]>[/b] " + nation + " said:\n";
	value += "[i]" + text + "[/i]";
	$(textArea).val(value + "\n----------------------------------\n\n");
	$('body,html').animate({scrollTop: $("#widebox-form").offset().top - 100});
	$(textArea).focus();
	$(textArea).caretToEnd();
}