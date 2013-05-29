(function() {
	//Find the region name
	var index = window.location.href.indexOf("region=") + 7;
	var endIndex = window.location.href.indexOf("#");
	var region;
	if (endIndex > -1) {
		region = window.location.href.substring(index, endIndex);
	} else {
		region = window.location.href.substring(index);
	}
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

		//var quote ="<div style='text-align:right; float:right; margin-top:-18px;'><a href='javascript:void(0);' onclick='quotePost(this);'>Quote</a></div>";
		var quote = '<div class="transparentoid" style="color: white; font-weight: bold; font-size: 8pt; padding: 2px 8px 2px 8px; background: black; background-color: rgba(0,0,0,0.2); border-radius: 30px; text-align:right; float:right; margin-top: -18px;margin-right: -7px;"><a href="javascript:void(0);" onclick="quotePost(this);">Quote</a></div>';
		var showSuppressedButton = "<div class='rmbbuttons'><a href='' class='forumpaneltoggle rmbshow'><img src='/images/rmbbshow.png' alt='Show' title='Show post'></a></div>";

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

		var atEarliestMessage = false;
		var rmboffset = 10;
		$(window).scroll(function() {
			if (atEarliestMessage) {
				return;
			}
			setTimeout(function() {
				//console.log("Scroll Top: " + $(window).scrollTop() + " Document Height: " + $(document).height() + " Window Height: " + $(window).height());
				if (isInRange($(window).scrollTop() - 5, $(document).height() - $(window).height(), $(window).scrollTop() + 5)) {
					$.get('/page=ajax/a=rmb/region=' + region + '/offset=' + rmboffset, function(data) {
						if (data.length > 1) {
							//Format HTML
							var html = "";
							$($(data).get().reverse()).each( function() {
								html += parseRMBPost($(this).html(), quote, $(this).attr('class'));//("<div class='" +  $(this).attr('class') + "' style='display: block;'>" + $(this).html() + quote + "</div>");
							});
							$(html).insertAfter('.rmbrow:last').hide().show('slow');
							//$($(data).get().reverse()).insertAfter('.rmbrow:last').hide().show('slow');
						} else if (!atEarliestMessage) {
							atEarliestMessage = true;
							$("<div class='rmbolder'>At Earliest Message</div>").insertAfter('.rmbrow:last').hide().show('slow');
						}
					});
					rmboffset += 10;
				}
			}, 25);
		});
	}

	function isInRange(min, value, max) {
		if (value > min && value < max) {
			return true;
		}
		return false;
	}

	function parseRMBPost(innerHTML, quoteHTML, className) {
		if (innerHTML.indexOf("rmbsuppressed") > -1) {
			//Check if it is self-deleted or mod deleted
			if (innerHTML.indexOf("rmbbuttons") == -1) {
				var startIndex = innerHTML.indexOf("/page=rmb/postid=") + "/page=rmb/postid=".length;
				var endIndex = innerHTML.indexOf('"', startIndex);
				var postId = innerHTML.substring(startIndex, endIndex);

				innerHTML = innerHTML.substring(0, 5) + showSuppressedButton + innerHTML.substring(5, innerHTML.length - 35);

				//Fetch post contents!
				$.get("/page=rmb/postid=" + postId + "/show=1", function(data) {
					var postName = "post-" + postId;
					var postStart = data.indexOf(postName) + 2 + postName.length;
					var postEnd = data.indexOf('</div></div><div class="rmbspacer">', postStart) + 6;
					
					var postHTML = data.substring(postStart, postEnd);
					//console.log(postHTML);
					document.getElementById(postName).innerHTML = postHTML;
				});
				innerHTML += "<div id='post-" + postId + "' class='hide suppressedbody-" + postId + "'></div>"
				innerHTML += "</div><div class='rmbspacer'></div>";
			}
			quoteHTML = "";
		}
		return ("<div class='" + className + "' style='display: block;'>" + innerHTML + quoteHTML + "</div>");
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
})();