var quote = '<div class="transparentoid QuoteLink"><a href="javascript:void(0);" onclick="quotePost(this);">Quote</a></div>';
var showSuppressedButton = "<div class='rmbbuttons'><a href='' class='forumpaneltoggle rmbshow'><img src='/images/rmbbshow.png' alt='Show' title='Show post'></a></div>";

//Add custom css
var css = '.QuoteLink{color: white; font-weight: bold; font-size: 8pt; padding: 2px 8px 2px 8px; background: black; background-color: rgba(0,0,0,0.2); border-radius: 30px; text-align:right; float:right; margin-top: -18px;margin-right: -7px;}';
var style = document.createElement('style');
style.type = 'text/css';
if (style.styleSheet){
  style.styleSheet.cssText = css;
} else {
  style.appendChild(document.createTextNode(css));
}
document.head.appendChild(style);

//Find the region name
var index = window.location.href.indexOf("region=") + 7;
var endIndex = window.location.href.indexOf("#");
var region;
if (endIndex > -1) {
	region = window.location.href.substring(index, endIndex);
} else {
	region = window.location.href.substring(index);
}

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
			   break;
			}
		}

		//Move the RMB reply area to the top
		if (typeof rmbPost != 'undefined') {
			//Remove the "From:" line
			$(rmbPost).children().each( function() {
				if ($(this).html().indexOf("From:") > -1) {
					$(this).remove();
				}
			});

			//Move the post form to the top
			var formHtml = "<form method='post' action='/page=lodgermbpost/region=" + region + "' id='rmb'>" + rmbPost.innerHTML + "</form>";
			rmbPost.parentNode.removeChild(rmbPost);
			$(formHtml).insertBefore('.rmbrow:first');
		}

		var forumView = jQuery('#content').find('.rmbview');
		var forumViewHTML = forumView.html();
		forumView.remove();
		$("<p class='rmbview'>" + forumViewHTML + "</p>").insertBefore('.rmbrow:first');

		$(window).scroll(handleInfiniteScroll);
	}
}

var atEarliestMessage = false;
var rmboffset = 10;
function handleInfiniteScroll() {
	if (atEarliestMessage) {
		return;
	}
	setTimeout(function() {
		if (isInRange($(window).scrollTop() - 5, $(document).height() - $(window).height(), $(window).scrollTop() + 5)) {
			$.get('/page=ajax/a=rmb/region=' + region + '/offset=' + rmboffset, function(data) {
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

nationstatesPlusPlus();

checkForRMBUpdates();
function checkForRMBUpdates(){
	setTimeout(function() {
		$.get('/page=ajax/a=rmb/region=' + region + '/offset=0', function(data) {
			if (data.length > 1) {
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
		checkForRMBUpdates();
	}, 10000);
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
	var postId = getRMBPostId(innerHTML);

	if (innerHTML.indexOf("rmbsuppressed") > -1) {
		quoteHTML = "";
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
	/*var youtube = link;
	youtube = youtube.replace(/(?:http:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/g, '<iframe width="420" height="345" src="http://www.youtube.com/embed/$1" frameborder="0" allowfullscreen></iframe>');
	if (youtube != link) {
		return youtube;
	}*/
	return '<a target="_blank" href="' + link + '">' + link + '</a>';
}

function quotePost(post) {
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
					value += nation + " said,\n";
					value += "[i]" + text + "[/i]";
					$(textArea).val(value + "\n");
					//$("#html,body").animate({scrollTop: $("#widebox-form").offset().top - 100});
					$('body,html').animate({scrollTop: $("#widebox-form").offset().top - 100});
					$(textArea).focus();
				}
			});
		}
	});
}

var _gaq = _gaq || [];
update(1);
function update(delay){
	setTimeout(function() {
		_gaq.push(['_setAccount', 'UA-41267101-1']);
		_gaq.push(['_trackPageview']);
		_gaq.push(['_setCustomVar', 1, 'Version', 'v1.0', 2]);
		update(60000);
	}, delay);
}