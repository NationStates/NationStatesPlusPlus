var quote = '<div class="transparentoid QuoteLink"><a href="javascript:void(0);" onclick="quotePost(this);">Quote</a></div>';
var showSuppressedButton = "<div class='rmbbuttons'><a href='' class='forumpaneltoggle rmbshow'><img src='/images/rmbbshow.png' alt='Show' title='Show post'></a></div>";

//Add custom css
var css = '.QuoteLink{color: white; font-weight: bold; font-size: 8pt; padding: 2px 8px 2px 8px; background: black; background-color: rgba(0,0,0,0.2); border-radius: 30px; text-align:right; float:right; margin-top: -18px;margin-right: -7px;}';
css += '.QuoteMenu{color: white; font-weight: bold; font-size: 12pt; padding: 2px 8px 2px 8px; background: black; background-color: rgba(0,0,0,0.2); border-radius: 14px; display: inline-block;}';
css += '.highlight {background: #FFFF00;}';
var style = document.createElement('style');
style.type = 'text/css';
if (style.styleSheet){
  style.styleSheet.cssText = css;
} else {
  style.appendChild(document.createTextNode(css));
}
document.head.appendChild(style);

//Find the region name from url
var index = window.location.href.indexOf("region=") + 7;
var endIndex = window.location.href.indexOf("#");
var region;
if (endIndex > -1) {
	region = window.location.href.substring(index, endIndex);
} else {
	region = window.location.href.substring(index);
}

var nationSelector = $(".STANDOUT:first");
var nation;
if (typeof nationSelector.attr("href") == 'undefined') {
	nation = "";
} else {
	nation = nationSelector.attr("href").substring(7);
}

//test if the page is active/open
var _isPageActive;
window.onfocus = function () { 
  _isPageActive = true; 
}; 

window.onblur = function () { 
  _isPageActive = false; 
};

function isPageActive() {
	return _isPageActive;
}

var _lastPageActivity = (new Date()).getTime();
$("#main").mousemove(function (c) {
	_lastPageActivity = (new Date()).getTime();
});

function getLastActivity() {
	return _lastPageActivity;
}

function nationstatesPlusPlus() {
	if (region.indexOf("display_region_rmb") == -1) {
		var elems = document.getElementsByTagName('*'), i;

		for (i in elems) {
			//Remove "older messages" area
			if ((" " + elems[i].className + " ").indexOf(" rmbolder ") > -1) {
				elems[i].parentNode.removeChild(elems[i]);
				break;
			}
		}
		
		$('input:radio:checked')

		var rmbPost = document.forms["rmb"];
		if (typeof rmbPost == 'undefined') {
			quote = "";
		}

		elems = document.getElementsByTagName('*'), i;

		//Reorder the existing RMB posts
		for (i in elems) {
			if ((" " + elems[i].className + " ").indexOf(" rmbtable2 ") > -1) {
			   var html = "";
			   $($(elems[i]).children().get().reverse()).each( function() {
					html += parseRMBPost($(this).html(), quote, $(this).attr('class'));
			   } );
			   elems[i].innerHTML = html;
			} else if ((" " + elems[i].className + " ").indexOf(" small ") > -1) {
				$(elems[i]).attr("class", "btn");
			}
		}

		var formHtml = "<div id='rmb-post-form' style='display: none;'><div style='text-align:center;'><p>You need to " + (nation.length > 0 ?  "move to the region" : "login to NationStates") + " first!</p></div></div>";
		//Move the RMB reply area to the top
		if (typeof rmbPost != 'undefined') {
			//Remove the "From:" line
			$(rmbPost).children().each( function() {
				if ($(this).html().indexOf("From:") > -1) {
					$(this).remove();
				}
			});

			//Move the post form to the top
			var formHtml = "<div id='rmb-post-form' style='display: none;'><form method='post' action='/page=lodgermbpost/region=" + region + "' id='rmb'>" + rmbPost.innerHTML + "</form></div>";
			rmbPost.parentNode.removeChild(rmbPost);
		}
		var widebox = $('.widebox:last');
		widebox.prepend(formHtml);

		//Move "Switch to Forum View" to top of RMB posts
		var forumView = jQuery('#content').find('.rmbview');
		var forumViewHTML = forumView.html();
		forumView.remove();
		$("<p class='rmbview'>" + forumViewHTML + "</p>").insertBefore(".rmbrow:first");
	
		//Add search box
		widebox.prepend("<div id='searchbox' style='display: none;'><div style='margin-top:6px; text-align:center;'><input id='rmb-search-input' placeholder='Search' type='search' style='width:35%; height:25px;' name='googlesearch' onkeydown='if (event.keyCode == 13) { searchRMB(); } else { updateSearchText(); }'></div></div>");

		//Add rmb menu area
		widebox.prepend("<div id='rmb-menu' style='text-align: center;'><div class='transparentoid QuoteMenu'><a href='javascript:void(0);' onclick='toggleRMBPostForm();'>Leave a message</a></div> - <div class='transparentoid QuoteMenu'><a href='javascript:void(0);' onclick='toggleSearchForm();'>Search messages</a></div></div");

		//Setup infinite scroll
		$(window).scroll(handleInfiniteScroll);
		
		//Replace census slider
		updateCensusSlider();
	}
}

function updateCensusSlider() {
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
			census.html("<div id='census-page-slider' style='text-align: center; width:75%; margin-left:12.5%;' class='noUiSlider'></div>");
			addCensusSlider(maxPage);
		}
	}
}

//Seems that for some reason noUiSlider plugin loads slowly, so need to be able to fail and retry
function addCensusSlider(maxPage) {
	try {
		$(".noUiSlider").noUiSlider({
			range: [1, maxPage], start: 1, step: 1, handles: 1, slide: function() {
			  updateCensusPage($(this).val());
		   }
		});
		updateCensusPage(1);
	} catch (e) {
		setTimeout(function() { addCensusSlider(maxPage); }, 250);
	}
}

var shinyPages = {};
var shinyRangePage = 1;
var requestNum = 1;
function updateCensusPage(page) {
	$("#handle-id").html("Page " + page);
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
		$('table[class$="shiny ranks"]').fadeTo(500, 0.3);
		$.get('/page=display_region/region=' + region + '?start=' + (page * 10 - 10), function(data) {
			shinyPages[page] = data;
			doShinyPageUpdate(data);
		});
	}, 250);
}

function doShinyPageUpdate(data) {
	var table = $('table[class$="shiny ranks"]');
	table.html($(data).find('table[class$="shiny ranks"]').html());
	table.fadeTo(500, 1);
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
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
	$.get('/page=ajax/a=rmbsearch/rmbsearch-text=' + document.getElementById("rmb-search-input").value + '/rmbsearch-region=' + region + '/rmbsearch-offset=' + searchOffset, function(data) {
		if (cancelled) {
			return;
		}
		
		var searchResults = document.getElementById("rmb-search-results");
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

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

var atEarliestMessage = false;
var rmboffset = 10;
function handleInfiniteScroll() {
	if (atEarliestMessage) {
		return;
	}
	//Infinite search Scroll
	if (isSearchResultsVisible()) {
		if (isInRange($(window).scrollTop() - 5, $(document).height() - $(window).height(), $(window).scrollTop() + (screen.height / 2.5))) {
			var searchPaused = document.getElementById("end-of-search-results");
			if (searchPaused != null) {
				$(searchPaused).remove();
				doRMBSearch();
			}
		}
	} else {
	//Infinite RMB post scroll
		setTimeout(function() {
			if (isInRange($(window).scrollTop() - 5, $(document).height() - $(window).height(), $(window).scrollTop() + 5)) {
				getRMBPosts(rmboffset, function(data) {
					if (data.length > 1) {
						//Format HTML
						var html = "";
						$($(data).get().reverse()).each( function() {
							html += parseRMBPost($(this).html(), quote, $(this).attr('class'));
						});
						$(html).insertAfter('.rmbrow:last').hide().show('slow');
					} else if (!atEarliestMessage) {
						atEarliestMessage = true;
						$("<div class='rmbolder'>At Earliest Message</div>").insertAfter('.rmbrow:last').hide().show('slow');
					}
				});
				rmboffset += 10;
			}
		}, 25);
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
			} else if (getLastActivity() + 60000 < (new Date()).getTime()) {
				updateDelay = 150000; //2.5 min
			}
			if ((new Date()).getTime() > (lastRMBUpdate + updateDelay)) {
				lastRMBUpdate = (new Date()).getTime();
				//update RMB
				$.get('/page=ajax/a=rmb/region=' + region + '/offset=0', function(data) {
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
							$(html).insertBefore('.rmbrow:first').hide().show('slow');
						}
					}
				});
				//Update telegrams indicator
				if (nation.length != 0) {
					$.get('/page=invalid', function(html) {
						var searchString = '<a href="page=telegrams">';
						var indicatorStart = html.indexOf(searchString);
						var indicatorEnd = html.indexOf('</a>', indicatorStart);
						$('a[href$="page=telegrams"]').html(html.substring(indicatorStart + searchString.length, indicatorEnd));
					});
				}
			}
		}
		checkForRMBUpdates(10000);
	}, delay);
}

var rmbCache = {};
function getRMBPosts(offset, callback) {
	if (offset in rmbCache) {
		callback(rmbCache[offset]);
	} else {
		$.get('/page=ajax/a=rmb/region=' + region + '/offset=' + offset, function(data) {
			rmbCache[offset] = data;
			callback(rmbCache[offset]);
		});
	}
}

//Extra Functions
function isInRange(min, value, max) {
	if (value > min && value < max) {
		return true;
	}
	return false;
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
	if (innerHTML.indexOf("rmbsuppressed") > -1 || innerHTML.indexOf(quoteHTML) > -1) {
		quoteHTML = "";
	}

	//TODO: finish name highlighting
	if (nation.length > 0) {
		var nameIndex = innerHTML.indexOf(nation)
		//while(nameIndex > -1) {
		//	innerHTML = innerHTML.
		//}
	}
	
	innerHTML = linkify(innerHTML);
	
	return ("<div id='rmb-post-" + postId + "' class='" + className + "' style='display: block;'>" + innerHTML + quoteHTML + "</div>");
}

function linkify(inputText) {
    var replacedText, replacePattern1, replacePattern2, replacePattern3;
	
	if (inputText.indexOf("nationstates.net/") > -1) {
		return inputText;
	}

    //URLs starting with http://, https://, or ftp://
    replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

    //Change email addresses to mailto:: links.
    replacePattern3 = /(\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,6})/gim;
    replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

    return replacedText;
}

function parseLink(link) {
	//This code works, just looks ugly in the RMB
	/*var youtube = link;
	youtube = youtube.replace(/(?:http:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/g, '<iframe width="420" height="345" src="http://www.youtube.com/embed/$1" frameborder="0" allowfullscreen></iframe>');
	if (youtube != link) {
		return youtube;
	}*/
	return '<a target="_blank" href="' + link + '">' + link + '</a>';
}

function quotePost(post) {
	//Show RMB if it is hidden
	if (!isRMBPostFormVisible()) {
		toggleRMBPostForm();
	}

	var nation = "";
	$(post.parentNode.parentNode).children().each(function() {
		if ($(this).attr('class') == "rmbauthor2") {
			var fullName = $(this).find("a").attr("href");
			if (fullName.indexOf("page=help") > -1) {
				nation = "[b]NationStates Moderators[/b]";
			} else if (fullName.indexOf("page=rmb") > -1) {
				nation = "[b]" + $(this).find("p").html() + "[/b]";
			} else {
				nation = "[nation]" + $(this).find("a").attr("href").substring(7) + "[/nation]";
			}
		}
	});
	$(post.parentNode.parentNode).children().each(function() {
		if ($(this).attr('class') == "rmbmsg2") {
			var text = "";
			$(this).children().each(function() {
				if ($(this).html().indexOf("rmbbdelete.png") == -1) {
					if (text.length > 0) {
						text += "\n\n";
					}
					if (this.children.length == 0) {
						text += $(this).html();
					} else {
						$(this).contents().each(function() {
							text += $(this).text();
						});
					}
				}
			});
			var form = document.forms["rmb"];
			$(form).children().each(function() {
				if ($(this).attr('class') == "widebox") {
					$(this).attr("id","widebox-form");
					var textArea = $(this).find("textarea");
					var value = $(textArea).val();
					if (value.length > 0) {
						value += "\n";
					}
					value += "[b]>[/b] " + nation + " said:\n";
					value += "[i]" + text + "[/i]";
					$(textArea).val(value + "\n\n");
					$('body,html').animate({scrollTop: $("#widebox-form").offset().top - 100});
					$(textArea).focus();
					$(textArea).caretToEnd()
				}
			});
		}
	});
}

nationstatesPlusPlus();
checkForRMBUpdates(10000);

var _gaq = _gaq || [];
update(1);
function update(delay){
	setTimeout(function() {
		_gaq.push(['_setAccount', 'UA-41267101-1']);
		_gaq.push(['_trackPageview']);
		_gaq.push(['_setCustomVar', 1, 'Version', 'v1.5', 2]);

		if (delay == 1) {
			_gaq.push(['_trackEvent', 'RMB', 'Region', region]);
		}
		update(60000);
	}, delay);
}