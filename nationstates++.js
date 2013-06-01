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
console.log("Nation: " + nation);
	
function nationstatesPlusPlus() {
	if (region.indexOf("display_region_rmb") == -1) {
		//console.log(region);
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
		widebox.prepend("<div id='searchbox' style='display: none;'><div style='margin-top:6px; text-align:center;'><input id='rmb-search-input' placeholder='Search' type='search' style='width:35%; height:25px;' name='googlesearch' onkeydown='if (event.keyCode == 13) { searchRMB(); } else { cancelSearch(); }'></div></div>");

		//Add rmb menu area
		widebox.prepend("<div id='rmb-menu' style='text-align: center;'><div class='transparentoid QuoteMenu'><a href='javascript:void(0);' onclick='toggleRMBPostForm();'>Leave a message</a></div> - <div class='transparentoid QuoteMenu'><a href='javascript:void(0);' onclick='toggleSearchForm();'>Search messages</a></div></div");

		//Setup infinite scroll
		$(window).scroll(handleInfiniteScroll);
	}
}

var keywords;
var lastSearchSuccessful = false;
var searchOffset = 0;
var results = 0;
var maxResults = 10;
var cancelled = false;
function searchRMB() {
	var searchWords = document.getElementById("rmb-search-input").value;
	keywords = searchToKeywords(searchWords);
	console.log("Keywords: " + keywords);
	//Hide RMB
	var rmb = $('.rmbtable2:last');
	rmb.attr("style", "display: none;");
	var searchResults = document.getElementById("rmb-search-results");
	if (searchResults === null) {
		$("<div id='rmb-search-results' style='display: block;' class='rmbtable2'></div>").insertBefore(rmb);
		searchResults = document.getElementById("rmb-search-results");
		$(searchResults).html("<p></p>");
	} else {
		$(searchResults).attr("style", "display: block;");
		$(searchResults).html("<p></p>");
	}
	cancelled = false;
	results = 0;
	maxResults = 10;
	searchOffset = rmboffset;
	rmb.children().each(searchRMBPost);
	searchOlderRMBPosts();
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

function cancelSearch() {
	cancelled = true;
	var wantToCancel = document.getElementById("want-to-cancel-search");
	if (wantToCancel != null) {
		$(wantToCancel).remove();
	}
}

function searchOlderRMBPosts() {
	getRMBPosts(searchOffset, function(data) {
		if (cancelled) {
			return;
		}
		var searchResults = document.getElementById("rmb-search-results");
		if (data.length > 1) {
			//Process RMB posts
			$($(data).get().reverse()).each(searchRMBPost);
			searchOffset += 10;

			//User is scrolling near bottom, keep adding more results!
			if (isInRange($(window).scrollTop() - 5, $(document).height() - $(window).height(), $(window).scrollTop() + (screen.height / 2.5))) {
				if (results + 5 >= maxResults) {
					maxResults += 10;
				}
			}
			
			var wantToCancel = document.getElementById("want-to-cancel-search");
			if (results < maxResults) {
				//We haven't found results, did user give us a useless query?
				if (results == 0) {
					if (wantToCancel === null) {
						$(searchResults).append("<div id='want-to-cancel-search' class='rmbolder'>Searched <div style='display:inline;' id='searched-count'>" + searchOffset + "</div> posts so far... Want to start over?  <button id='cancel-search' class='btn' onclick='cancelSearch()'>Cancel</button></div>");
						$('body,html').animate({scrollTop: $(document).height()});
					} else {
						$("#searched-count").html(searchOffset);
					}
					wantToCancel = null; //set to null so it is not removed later
				}
				//Keep searching!
				searchOlderRMBPosts();
			} else {
				$(searchResults).append("<div id='search-paused' class='rmbolder'>Load More Results</div>");
			}
			
			//Remove want to cancel
			if (wantToCancel != null) {
				$(wantToCancel).remove();
			}
		} else {
			if (results == 0) {
				$(searchResults).append("<div class='rmbolder'>No Search Results</div>");
				rmb.attr("style", "display: block;");
				lastSearchSuccessful = false;
			} else {
				lastSearchSuccessful = true;
				$(searchResults).append("<div class='rmbolder'>End of Search Results</div>");
			}
		}
	});
}

function searchRMBPost() {
	var result = null;
	var lowercaseHtml = $(this).html().toLowerCase();
	for (i in keywords) {
		var keyword = keywords[i];
		if (keyword === null || keyword.length == 0) {
			continue;
		}
		if (lowercaseHtml.indexOf(keyword.toLowerCase()) > -1) {
			if (result === null) {
				var postId = getRMBPostId($(this).html()) + "-search";
				result = $(document.getElementById("rmb-search-results")).append(parseRMBPostWithId($(this).html(), quote, $(this).attr('class'), postId));
				results++;
			}
			$(result).highlight(keyword);
		}
	}
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
			var searchPaused = document.getElementById("search-paused");
			if (searchPaused != null) {
				maxResults += 10;
				$(searchPaused).remove();
				searchOlderRMBPosts();
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

function checkForRMBUpdates(){
	setTimeout(function() {
		if (!isSearchResultsVisible()) {
			$.get('/page=ajax/a=rmb/region=' + region + '/offset=0', function(data) {
				if (data.length > 1 && !isSearchResultsVisible()) {
					var html = "";
					//Check for new posts
					$($(data).get().reverse()).each( function() {
						var postId = getRMBPostId($(this).html());
						if (document.getElementById("rmb-post-" + postId) === null) {
							console.log("no post for id: " + postId);
							html += parseRMBPost($(this).html(), quote, $(this).attr('class'));
						}
					});
					//Insert new posts
					if (html.length > 0) {
						$(html).insertBefore('.rmbrow:first').hide().show('slow');
					}
				}
			});
		}
		checkForRMBUpdates();
	}, 10000);
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

	//Parse for HTTP links
	var urlIndex = innerHTML.indexOf("http://");
	var aLinkUrl = innerHTML.indexOf('href="http://');
	while(urlIndex > -1) {
		if (aLinkUrl + 6 == urlIndex) {
			urlIndex = innerHTML.indexOf("http://", urlIndex + 10);
			aLinkUrl = innerHTML.indexOf('href="http://', urlIndex + 10);
		} else {
			var endSpaceIndex = innerHTML.indexOf(" ", urlIndex + 1);
			var endParagraphIndex = innerHTML.indexOf("</p>", urlIndex + 1);
			var endDivIndex = innerHTML.indexOf("</div>", urlIndex + 1);
			var endIndex = Math.min(endSpaceIndex, endParagraphIndex, endDivIndex);
			var link = innerHTML.substring(urlIndex, endIndex);

			var href = parseLink(link);
			innerHTML = innerHTML.substring(0, urlIndex) + href + innerHTML.substring(endIndex);
			
			urlIndex = innerHTML.indexOf("http://", urlIndex + href.length);
			aLinkUrl = innerHTML.indexOf('href="http://', urlIndex + href.length);
		}
	}

	//Parse for https links
	urlIndex = innerHTML.indexOf("https://");
	while(urlIndex > -1) {
		var endSpaceIndex = innerHTML.indexOf(" ", urlIndex + 1);
		var endParagraphIndex = innerHTML.indexOf("</p>", urlIndex + 1);
		var endDivIndex = innerHTML.indexOf("</div>", urlIndex + 1);
		var endIndex = Math.min(endSpaceIndex, endParagraphIndex, endDivIndex);
		var link = innerHTML.substring(urlIndex, endIndex);

		var href = parseLink(link);
		innerHTML = innerHTML.substring(0, urlIndex) + href + innerHTML.substring(endIndex);
		
		urlIndex = innerHTML.indexOf("https://", urlIndex + href.length);
	}

	//Parse for www links
	urlIndex = innerHTML.indexOf("www.");
	while(urlIndex > -1) {
		if (innerHTML.substring(urlIndex - 8, urlIndex).indexOf("http") == -1) {
			var endSpaceIndex = innerHTML.indexOf(" ", urlIndex + 1);
			var endParagraphIndex = innerHTML.indexOf("</p>", urlIndex + 1);
			var endDivIndex = innerHTML.indexOf("</div>", urlIndex + 1);
			var endIndex = Math.min(endSpaceIndex, endParagraphIndex, endDivIndex);
			var link = innerHTML.substring(urlIndex, endIndex);

			var href = parseLink("http://" + link);
			innerHTML = innerHTML.substring(0, urlIndex) + href + innerHTML.substring(endIndex);
			
			urlIndex = innerHTML.indexOf("www.", urlIndex + href.length);
		} else {
			urlIndex = innerHTML.indexOf("www.", urlIndex + 10);
		}
	}
	return ("<div id='rmb-post-" + postId + "' class='" + className + "' style='display: block;'>" + innerHTML + quoteHTML + "</div>");
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
	//console.log("nation: " + nation);
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
				//console.log("class: " + $(this).attr('class'));
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
					//$("#html,body").animate({scrollTop: $("#widebox-form").offset().top - 100});
					$('body,html').animate({scrollTop: $("#widebox-form").offset().top - 100});
					$(textArea).focus();
					$(textArea).caretToEnd()
				}
			});
		}
	});
}

nationstatesPlusPlus();
checkForRMBUpdates();

var _gaq = _gaq || [];
update(1);
function update(delay){
	setTimeout(function() {
		_gaq.push(['_setAccount', 'UA-41267101-1']);
		_gaq.push(['_trackPageview']);
		_gaq.push(['_setCustomVar', 1, 'Version', 'v1.4', 2]);
		update(60000);
	}, delay);
}