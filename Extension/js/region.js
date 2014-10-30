(function() {
	if (getVisiblePage() == "region" || getVisiblePage() == "display_region") {
		setupRegionPage();
	} else if (getVisiblePage() == "display_region_rmb") {
		$('[name="lodge_message"]').attr("class", "button icon approve primary");
		$('[name="lodge_message"]').attr("value", "1");
		$('[name="lodge_message"]').changeElementType("button");
		$('[name="lodge_message"]').html("Lodge Message");
		$('[name="preview"]').attr("class", "previewbutton button search icon");
		$('[name="preview"]').removeAttr("value");
		$('[name="preview"]').changeElementType("button");
		$('[name="preview"]').html("Preview");
	} else if (getVisiblePage() == "region_control") {
		addFormattingButtons();
	}
})();

function setupRegionPage() {
	(new UserSettings()).child("auto_update").on(function(data) {
		if (data["auto_update"]) {
			$(window).on("websocket.rmb_message", function(event) {
				console.log("received rmb update event");
				updateRMB();
			});
		} else {
			$(window).off("websocket.rmb_message");
		}
	}, true);

	addUpdateTime();
	addRegionalControls();
	addFontAwesomeIcons();
	updateButtonCSS();
	updateMoveRegionButton();
	handlePostRatings();
	handleNewRegionalMessages();

	(new UserSettings()).child("show_all_suppressed_posts").once(function(data) {
		if (data["show_all_suppressed_posts"]) {
			$(window).on("rmb/update", function(event) {
				$("#p" + event.postId).find(".hide").show();
			});
		}
	}, true);
	
	(new UserSettings()).child("clickable_links").once(function(data) {
		if (data["clickable_links"]) {
			$(window).on("rmb/update", function(event) {
				var html = $("#p" + event.postId).html();
				if (typeof html == "undefined") {
					console.log("UNDEFINED POST!!");
					console.log($("#p" + event.postId));
					console.log(event.postId);
					console.log(event);
				}
				var linkifiedHtml = linkify(html);
				if (html != linkifiedHtml) {
					$("#p" + event.postId).html(linkifiedHtml);
				}
			});
		}
	}, true);

	(new UserSettings()).child("infinite_scroll").once(function(data) {
		var children;
		if (data["infinite_scroll"]) {
			//Remove older link
			$(".rmbolder").remove();
			//Move msg box to top
			relocatePostMessageBox();
			//Relocate ads
			handleRMBAds();
			//Move forum view link
			var forumViewHTML = $('#content .rmbview')[0].outerHTML;
			$('#content .rmbview').remove();
			$(forumViewHTML).insertBefore(".rmbtable2:first");
			//Show footer link when scrolling down
			$("h3:contains('Regional Message Board')").attr("id", "rmb_header");
			$(window).scroll(showFooterLink);
			//Show infinite rmb scroll
			$(window).scroll(handleInfiniteScroll);
			
			children = $(".rmbtable2").children().get().reverse();
		} else {
			children = $(".rmbtable2").children().get();
		}
		var postIds = [];
		var html = "";
		$(children).each(function() {
			postIds.push($(this).attr("id").substring(1));
			html += $(this).prop("outerHTML");
		});
		$(".rmbtable2").html(html);
		//Trigger post event for existing posts
		for (var i = 0; i < postIds.length; i++) {
			var event = jQuery.Event("rmb/update");
			event.postId = postIds[i];
			$(window).trigger(event);
		}
	}, true);

	(new UserSettings()).child("search_rmb").once(function(data) {
		if (data["search_rmb"]) {
			relocatePostMessageBox();
			$(window).scroll(handleSearchScroll);
			$('.rmbolder').css("margin-top", "20px");
			$("#rmb-post-form").hide();
			
			var wideboxArea = $(".widebox:contains('Forum View')");
			//Add rmb menu area
			$("<div id='rmb-menu' style='text-align: center;'><button class='button RoundedButton rmb-message'>Leave a message</button> <button class='button RoundedButton search-rmb'>Search messages</button></div").insertBefore(wideboxArea);
			$("<div id='searchbox' style='display: none;'><div style='margin-top:6px; text-align:center;'><input id='rmb-search-input' placeholder='Search' type='text' style='width:36.5%;' class='text-input-lg'><p><input id='rmb-search-input-region' placeholder='Region' type='text' style='width:16.5%; margin-right: 2%;'  class='text-input-lg'><input id='rmb-search-input-author' placeholder='Author' type='text' style='width:16.5%;' class='text-input-lg'><p></div></div>").insertBefore(wideboxArea);
			$("button.search-rmb").on("click", toggleSearchForm);
			$("button.rmb-message").on("click", toggleRMBPostForm);
			$("#rmb-search-input, #rmb-search-input-region, #rmb-search-input-author").on("keydown", searchRMB);
		}
	}, true);

	$('body').on('click', "button[name='lodge_message']", doRMBPost);

	addFormattingButtons();

	var census = $("h2:contains('Today's World Census Report')");
	$("<div id='census_report_container'></div>").insertAfter(census);
	if ($("#content:contains('The WA has not compiled a report for this region yet.')").length == 0) {
		$("#census_report_container").next().appendTo($("#census_report_container"));
		$("#census_report_container").next().appendTo($("#census_report_container"));
		$("#census_report_container").next().appendTo($("#census_report_container"));
		$("#census_report_container").next().appendTo($("#census_report_container"));
		$("h6").appendTo($("#census_report_container"));
		census.html(census.html() + "<a style='font-family: Verdana,Tahoma; font-size: 10pt; margin-left: 10px;' class='toggle-census-report' href='#'>(Hide)</a>");
		$("a.toggle-census-report").click(function(event) {
			event.preventDefault();
			if ($("#census_report_container:visible").length == 0) {
				$("#census_report_container").show();
				$("a.toggle-census-report").html("(Hide)");
				(new UserSettings()).child("show_world_census").set(true);
			} else {
				$("#census_report_container").hide();
				$("a.toggle-census-report").html("(Show)");
				(new UserSettings()).child("show_world_census").set(false);
			}
		});

		(new UserSettings()).child("show_world_census").on(function(data) {
			if (!data["show_world_census"]) {
				$("#census_report_container").hide();
				$("a.toggle-census-report").html("(Show)");
			} else {
				$("#census_report_container").show();
				$("a.toggle-census-report").html("(Hide)");
			}
		}, true);

		$("<h2>Regional Population <a style='font-family: Verdana,Tahoma; font-size: 10pt; margin-left: 10px;' class='toggle-pop-report' href='#'>(Hide)</a></h2><div id='regional-pop'></div><div class='hzln'></div>").insertAfter($("#census_report_container").next());

		$("<div id='highcharts_graph' graph='region_chart' region='" + getVisibleRegion() + "' title='" + getVisibleRegion().replaceAll("_", " ").toTitleCase() + "'></div>").insertAfter($("#census_report_container"));

		$("a.toggle-pop-report").click(function(event) {
			event.preventDefault();
			if ($("#regional-pop:visible").length == 0) {
				$("#regional-pop").show();
				$("a.toggle-pop-report").html("(Hide)");
				(new UserSettings()).child("show_regional_population").set(true);
				$("<div id='highcharts_graph' graph='set_chart_size' width='" + $("#regional-pop").width() + "' height='" + 400 + "'></div>").insertAfter($("#census_report_container"));
			} else {
				$("#regional-pop").hide();
				$("a.toggle-pop-report").html("(Show)");
				(new UserSettings()).child("show_regional_population").set(false);
			}
		});
		(new UserSettings()).child("show_regional_population").on(function(data) {
			if (data["show_regional_population"]) {
				$("#regional-pop").show();
				$("a.toggle-pop-report").html("(Hide)");
			} else {
				$("#regional-pop").hide();
			$("a.toggle-pop-report").html("(Show)");
			}
		}, true);
	}
}

function handleRMBAds() {
	//Move ad from bottom of RMB to above RMB
	$("<div name='filler' style='height:100px;'></div>").insertBefore($("h3:contains('Regional Message Board')"));
	var filler = $("div[name='filler']");
	var adBox = $("#regionbanneradbox");
	var adContent = $("#regionbanneradboxinner");
	var lastTop = 0;
	var updateAdPosition = function() {
		if (adContent.width() > 10 && adContent.height() > 10)
		{
			adBox.css("border", "2px solid black");
		}
		if (lastTop != filler.offset().top) {
			adBox.css("position", "absolute").css("top", filler.offset().top + 5 + "px").css("margin-left", "16.5%").css("margin-left", "calc(50% - " + (adBox.width() / 2 + 100) + "px");
			lastTop = filler.offset().top;
			filler.height(adBox.height());
		}
		setTimeout(updateAdPosition, 50);
	};
	$(window).resize(updateAdPosition);
	updateAdPosition();
}

function relocatePostMessageBox() {
	if ($("#rmb-post-form").length == 0) {
		var formHtml = "<div id='rmb-post-form' style='display: none;'><div style='text-align:center;'><p>You need to " + (getUserNation().length > 0 ?  "move to the region" : "login to NationStates") + " first!</p></div></div>";
		$("form[id='rmb'] p").each(function() {
			if ($(this).html().indexOf("From: ") != -1)
				$(this).remove();
		});
		if ($("form[id='rmb']").length > 0) {
			formHtml = "<div id='rmb-post-form'><form id='rmb'>" + $("form[id='rmb']").html() + "</form></div>";
			$("form[id='rmb']").remove();
		}
		$('.widebox:last').prepend(formHtml);
	}
}

function handleNewRegionalMessages() {
	$(window).on("rmb/update", function(event) {
		var id = event.postId;
		var post = $("#p" + id);
		post.find(".rmbmsg2").append("<div postid='" + id + "' class='post-ratings'><ul class='post-rating-list' style='opacity: 0;'><li class='undo-rating' style='display:none;'><a href='javascript:void(0)'>Undo Rating</a></li><li name='like'><a href='javascript:void(0)'><img style='margin-right: 3px;' src='https://nationstatesplusplus.net/nationstates/static/like.png' alt='Like'></a></li><li name='dislike'><a href='javascript:void(0)'><img style='margin-right: 3px;' src='https://nationstatesplusplus.net/nationstates/static/dislike2.png' alt='Dislike'></a></li></ul></div>");
		setTimeout(function(post) {
			var authorHeight = post.find(".rmbauthor2").height() + 17;
			var msgHeight = post.find(".rmbmsg2").height();
			if (authorHeight > msgHeight) {
				post.find(".post-ratings").attr("style", "margin-top: " + (authorHeight - msgHeight) + "px;");
			}
		}, 500, post);

		if (getUserRegion() != getVisibleRegion()) {
			return;
		}

		sendWebsocketEvent("rmb_ratings", { "rmb_post_id": id });
		post.on("mouseenter", function(e){
			$(e.currentTarget).find(".post-rating-list").stop().animate({opacity:"1.0"},200);
		});
		post.on("mouseleave", function(e){
			$(e.currentTarget).find(".post-rating-list").stop().animate({opacity:"0"},200);
		});
		post.find("li[name='like']").find("a").on("click", function (e) {
			e.preventDefault();
			var id = $(this).parents(".post-ratings:first").attr("postid");
			
			sendWebsocketEvent("rate_rmb_post", { "rmb_post_id": id, "rating" : 1 }, true);
		});
		post.find("li[name='dislike']").find("a").on("click", function (e) {
			e.preventDefault();
			var id = $(this).parents(".post-ratings:first").attr("postid");
			
			sendWebsocketEvent("rate_rmb_post", { "rmb_post_id": id, "rating" : 0 }, true);
		});
		post.find(".undo-rating").find("a").on("click", function(event) {
			event.preventDefault();
			var id = $(this).parents(".post-ratings:first").attr("postid");
			var post = $("#p" + id);
			var rating = post.find("span[rated='1']");
			var amt = rating.attr("amt");
			if (amt == 1) {
				rating.prev().remove();
				rating.remove();
			} else {
				rating.html(rating.html().replaceAll(amt, amt - 1));
			}
			post.find(".post-rating-list").find("li").show();
			post.find(".undo-rating").hide();
			sendWebsocketEvent("rate_rmb_post", { "rmb_post_id": id, "rating" : -1 }, true);
		});
	});
}

function handlePostRatings() {
	var updateRatings = function(event) {
		var data = event.json;
		console.log("rmb ratings: ");
		console.log(data);
		var likes = 0;
		var dislikes = 0;
		var rating = -1;
		var postId = data.rmb_post;
		var dislikeTooltip = "";
		var likeTooltip = "";
		for (var i = 0; i < data.ratings.length; i++) {
			if (data.ratings[i].type == 0) {
				if (dislikes != 0) dislikeTooltip += ", ";
				dislikeTooltip += data.ratings[i].nation.replaceAll("_", " ").toTitleCase();
				dislikes += 1;
			}
			else if (data.ratings[i].type == 1) {
				if (likes != 0) likeTooltip += ", ";
				likeTooltip += data.ratings[i].nation.replaceAll("_", " ").toTitleCase();
				likes += 1;
			}
			if (data.ratings[i].nation.toLowerCase().replaceAll(" ", "_") == getUserNation()) {
				rating = data.ratings[i].type;
			}
		}
		var post = $("#p" + postId);
		console.log(post);
		post.find(".post-ratings").find("span[name='rating-container']").remove();
		post.find(".post-ratings").prepend("<span name='rating-container'></span>");
		if (rating > -1) {
			post.find(".post-rating-list").find("li").hide();
			post.find(".undo-rating").show();
		} else {
			post.find(".post-rating-list").find("li").show();
			post.find(".undo-rating").hide();
		}
		if (dislikes > 0) {
			post.find("span[name='rating-container']").prepend("<img src='https://nationstatesplusplus.net/nationstates/static/dislike2.png' alt='Dislike' title='" + dislikeTooltip + "'><span amt='" + dislikes + "' " + (rating == 0 ? "rated='1'" : "") + " class='post-rating-desc'>Dislike x " + dislikes + "</span>");
		}
		if (likes > 0) {
			post.find("span[name='rating-container']").prepend("<img src='https://nationstatesplusplus.net/nationstates/static/like.png' alt='Like' title='" + likeTooltip + "'><span amt='" + likes + "' " + (rating == 1 ? "rated='1'" : "") + " class='post-rating-desc'>Like x " + likes + "</span>");
		}
	};
	$(window).on("websocket.rmb_ratings", updateRatings);
}

function updateButtonCSS() {
	var changeRegion = $("a[href='page=change_region']");
	if (changeRegion.length > 0) {
		changeRegion.addClass("button");
	}
	$(".small").attr("class", "button");
	$(".hilite").attr("class", "button");
	var dossier = $("input[type='submit'].button");
	$("input[type='submit'].button").each(function() {
		$(this).html($(this).val()).changeElementType("button")
	});
}

function updateMoveRegionButton() {
	//Trim off the 'Tired of life in...' crap
	var passworded = $("img[alt='Password required']").length > 0;
	var moveRegion = $("button[name='move_region']");
	if (moveRegion.length > 0) {
		moveRegion.parent().html(moveRegion[0].outerHTML + "<input type='password' placeholder='Region Password' class='region_password text-input' style='display:none;' id='region_password_input'><span id='invalid-pass' style='display:none; margin-left: 7px; color:red;'>Invalid Password'</span>");
		if (passworded) {
			$("button[name='move_region']").addClass("button-warning").addClass("icon").addClass("lock");
		}
	}
	//Remove silly redirect
	$("body").on("click", "button[name='move_region']", function(event) {
		event.preventDefault();
		if ($(this).attr("class").contains("lock")) {
			if ($("#region_password_input:visible").length == 0) {
				$("#region_password_input").show();
				return;
			} else if ($("#region_password_input").val().length == 0) {
				$("#invalid-pass").show();
				return;
			}
		}
		$(this).attr("disabled", true);
		var password = $("#region_password_input").val();
		$.post("//www.nationstates.net/page=change_region?nspp=1", "localid=" + $("input[name='localid']").val() + "&region_name=" + $("input[name='region_name']").val()
																+ "&move_region=1" + (password.length > 0 ? "&password=" + encodeURIComponent(password) : ""), function(data) {
			if (data.toLowerCase().contains("you have not entered the correct password")) {
				$("#invalid-pass").html("Your password is incorrect!").show();
				$("button[name='move_region']").attr("disabled", false);
			} else if (data.toLowerCase().contains("you have been temporarily blocked from moving into password-protected regions.")) {
				$("#invalid-pass").html("You repeatedly entered the wrong password, so you have been temporarily blocked from password-protected regions.").show();
				$("#region_password_input").attr("disabled", true);
				$("button[name='move_region']").attr("disabled", true);
			} else {
				$("button[name='move_region']").attr("disabled", false);
				window.location.href = "//www.nationstates.net/region=" + $("input[name='region_name']").val();
			}
		}).fail(function(data) {
			$("button[name='move_region']").attr("disabled", false);
			$("#content").html($(data).find("#content"));
		});
	});
}

function addFontAwesomeIcons() {
	var founder = $("strong:contains('Founder'):first");
	$("strong:contains('WA Delegate'):first").html("<i class='fa fa-users'></i> <span id='wa_delegate_title'>WA Delegate</span>");
	if (founder.length > 0) {
		$("strong:contains('Founder'):first").html("<i class='fa fa-star'></i> <span id='founder_title'>Founder</span>");
	} else {
		founder = $("strong:contains('WA Delegate'):first");
	}
	$(window).on("websocket.region_titles", function(event) {
		var data = event.json;
		if (data.delegate_title != null) {
			$("#wa_delegate_title").html($("<div></div>").html(data.delegate_title).text());
		}
		if (data.founder_title != null) {
			$("#founder_title").html($("<div></div>").html(data.founder_title).text());
		}
	});
	$(window).on("websocket.region_newspaper", function(event) {
		var json = event.json;
		if ($("#newspaper_icon").length == 0)
			$("<div id='newspaper_icon'><p><strong><img style='height: 13px;' src='https://nationstatesplusplus.net/nationstates/static/" + (isDarkTheme() ? "dark_" : "") + "newspaper_icon.png'> Newspaper: </strong><a id='rnewspaper_link'><a></p></div>").insertAfter(founder.parent());
		$("#rnewspaper_link").html(parseBBCodes(event.json.title)).attr("href", "/page=blank?lookup_newspaper=" + event.json.newspaper_id);
		$("strong:contains('WA Delegate'):first").parent().css("min-height", "0px");
	});

	var regionalPower = $("strong:contains('Regional Power:')");
	if (regionalPower.length > 0) {
		regionalPower.html("<i class='fa fa-bolt'></i> " + regionalPower.html().substring(9));
		var parent = regionalPower.parent();
		parent.addClass("regional_power");
		parent.css("right", Math.max($("img.rflag:first").width() - parent.width() + 8, 20) + "px");
		if (isRiftTheme()) {
			parent.css("top", "170px");
		}
		if ($("strong:contains('Founder'):first").length == 0) {
			$("strong:contains('WA Delegate'):first").parent().css("min-height", "50px");
		}
	}

	var embassies = $("strong:contains('Embassies:')");
	if (embassies.length > 0) {
		embassies.html("<i class='fa fa-globe'></i> " + embassies.html());
	}

	var tags = $("strong:contains('Tags:')");
	if (tags.length > 0) {
		tags.html("<i class='fa fa-cloud'></i> " + tags.html());
	}

	var population = $("p:contains('most in the world'):first");
	if (population.length == 0) {
		population = tags.parents("p").next();
	}
	if (population.length > 0) {
		population.prepend("<strong><i class='fa fa-bar-chart-o'></i> Population: </strong>");
		population.append("<span style='margin-left: 10px; font-size: 85%;' id='record_pop'></span>");
		$(window).on("websocket.region_record_population", function(event) {
			if (parseInt(event.json.population) > 0){
				$("#record_pop").html("<i> (A record of " + event.json.population + " nations occurred on " + (new Date(event.json.timestamp)).customFormat("#MMM# #D#, #YYYY#") + ") </i>");
			}
		});

		//Regional Maps
		$("<p id='region_map' style='display:none; height: 10px;'><img src='https://nationstatesplusplus.net/nationstates/static/" + (isDarkTheme() ? "dark_" : "") + "map3.png' style='width: 16px;'><span style='position: relative; top: -5px;'><strong> Map: </strong><span id='regional_map_link'></span></span></p>").insertAfter(population);
		
		//NSWiki
		$("<strong><i class='fa fa-pencil-square-o'></i> NSWiki: </strong><a href='http://nswiki.org/region/" + $("h1 a:first").text() + "'>" + $("h1 a:first").text() + "</a>").insertAfter($("#region_map"));
		
		//Fetch region map
		$(window).on("websocket.region_map", function(event) {
			var data = event.json;
			if (data.regional_map != null) {
				$("#regional_map_link").html("<a href='" + data.regional_map + "' target='_blank'>Regional Map of " + getVisibleRegion().replaceAll("_", " ").toTitleCase() + "</a>");
				var mapPreview = data.regional_map_preview.replace("http://", "//");
				$("#regional_map_link").attr("preview", mapPreview);
	
				//Create floating div
				if ($("#regional_map_preview").length == 0)
					$("body").append("<div id='regional_map_preview' style='display:none;'></div>");
				$("#regional_map_preview").html("<a href='" + mapPreview + "' target='_blank'><img src='" + mapPreview + "' style='max-width:500px; max-height:600px; margin-bottom: -3px;'></a>");
				$("#region_map").show();

				(new UserSettings()).child("show_regional_map_preview").once(function(data) {
					if (data["show_regional_map_preview"]) {
						$("#regional_map_link").on("mouseenter", function(event) {
							if ($("#regional_map_preview:visible").length == 0) {
								$("#regional_map_preview").show();
								$("#regional_map_preview").css("position", "absolute").css("left", "200px").css("top", $("#regional_map_link").offset().top + $("#regional_map_link").height());
								if (isDarkTheme()) {
									$("#regional_map_preview").css("border", "2px solid white");
								} else {
									$("#regional_map_preview").css("border", "2px solid grey");
								}
								$("#regional_map_preview").on("mouseenter", function(event) {$("#regional_map_preview").show();	});
								$("#regional_map_preview").on("mouseleave", function(event) {$("#regional_map_preview").hide();	});
							}
						});
						$("#regional_map_link").on("mouseleave", function(event) {$("#regional_map_preview").hide();});
					}
				}, true);
			}
		});
	}

	$("p:contains('Construction of embassies with')").each(function() {
		$(this).prepend("<i style='margin-right:4px;' class='fa fa-cog'></i>");
	});
	$("p:contains('is being withdrawn. Closure expected in')").each(function() {
		$(this).prepend("<i style='margin-right:4px;' class='fa fa-exclamation-triangle'></i>");
	});
}

function addRegionalControls() {
	var rControls = $("a[href='page=region_control/region=" + getVisibleRegion() + "']");
	if (rControls.length > 0) {
		$("<a href='page=region_admin/region=" + getVisibleRegion() + "'>Administration</a><span> &#8226; </span>").insertBefore(rControls);
		rControls.html("Regional Controls");
		
		var founder = $("strong:contains('Founder'):first");
		var userIsFounder = (founder.length > 0 && (typeof founder.next().attr("href") != "undefined") && founder.next().attr("href").substring(7) == getUserNation());
		$("<span> &#8226; </span><a name='rc' href='page=blank/?banhammer=" + getVisibleRegion() + (userIsFounder ? "&free=true" : "") + "'>Banhammer</a>").insertAfter(rControls);
	} else {
		rControls = $("a[href='page=region_admin/region=" + getVisibleRegion() + "']");
		$("<span> &#8226; </span><a name='rc' href='page=region_control/region=" + getVisibleRegion() + "'>Regional Controls</a>").insertAfter(rControls);
	}
	rControls.parent().append("<span id='recruit-admin' style='display:none'> &#8226; <a href='page=blank?recruitment=" + getVisibleRegion() + "'>Recruitment</a></span>");

	rControls.parent().prepend("<i style='margin-right:4px;' class='fa fa-wrench'></i>");
}

function addUpdateTime() {
	$(window).on("websocket.region_updates", function(event) {
		var data = event.json;
		var text;
		var update;
		var hours = (Math.floor(Date.now() / (24 * 60 * 60 * 1000)) * 24 * 60 * 60 * 1000);
		if ((Date.now() - hours) > data.minor.mean || (Date.now() - hours) < data.major.mean){
			update = data.major;
		} else {
			update = data.minor;
		}
		if (update.mean != 0) {
			var nextUpdate = hours + update.mean;
			if ($("h1:first .updatetime").length == 0)
				$("h1:first").append("<span class='updatetime'></span>");
			$("h1:first .updatetime").html("Next Update: " + (new Date(nextUpdate)).customFormat("#hh#:#mm#:#ss# #AMPM#") + " [&plusmn; " + Math.floor(update.std * 2 / 1000) + " s]");
			$("h1:first .updatetime").attr("title", "Update Order: " + update.update_order);
		}
	});
}

function encodeRMBPost(message) {
	var d2h = function(d) {return d.toString(16);}
	var toWindows1252 = function(string) {
		table = {
			'\x81': 129, '\x8d': 141, '\x8f': 143, '\x90': 144, 
			'\x9d': 157, '\u0152': 140, '\u0153': 156, '\u0160': 138, 
			'\u0161': 154, '\u0178': 159, '\u017d': 142, '\u017e': 158, 
			'\u0192': 131, '\u02c6': 136, '\u02dc': 152, '\u2013': 150, 
			'\u2014': 151, '\u2018': 145, '\u2019': 146, '\u201a': 130, 
			'\u201c': 147, '\u201d': 148, '\u201e': 132, '\u2020': 134, 
			'\u2021': 135, '\u2022': 149, '\u2026': 133, '\u2030': 137, 
			'\u2039': 139, '\u203a': 155, '\u20ac': 128, '\u2122': 153
		};
		var errors = false;
		var ret = new Array(string.length);	
		for (var i = 0; i < string.length; i++) {
			var ch = string.charCodeAt(i);
			if (ch <= 127) {
				ret[i] = ch;
			} else {
				ret[i] = table[string[i]];
				if (typeof ret[i] === "undefined") {
					ret[i] = 0;
					errors = true;
				}
			}
		}
		return { converted: ret, error: errors};
	}
	var data = toWindows1252(message);
	var chars = data.converted;
	var result = "";
	for (var i = 0; i < chars.length; i++) {
		if (chars[i] > 16) {
			result += "%" + d2h(chars[i]);
		} else {
			result += String.fromCharCode(chars[i]);
		}
	}
	return {converted: result, error: data.error};
}

function doRMBPost(event) {
	event.preventDefault();
	var chkValue = $('input[name="chk"]').val(),
		messageValue = $('textarea[name="message"]').val(),
		url = "/page=lodgermbpost/region=" + getVisibleRegion();
	
	var lodgeMessage = $("button[name='lodge_message']");
	var removeWarning = function() {
		$(".bbcode-error").remove();
		$("button[name='lodge_message']").removeClass("danger");
		$("button[name='lodge_message']").html("Lodge Message");
	};
	if (hasInvalidBBCodes(messageValue) && lodgeMessage.html() != "Lodge Message Anyway") {
		lodgeMessage.html("Lodge Message Anyway");
		lodgeMessage.addClass("danger");
		$("<p class='bbcode-error' style='color:red'>Your Message contains invalid BBCodes!</p>").insertAfter(lodgeMessage.next());
		$('textarea[name="message"]').on("keypress", function(event) {
			removeWarning();
			$('textarea[name="message"]').off("keypress");
		});
		return;
	}
	removeWarning();

	var conversion = encodeRMBPost(messageValue);
	if (conversion.error) {
		//Fallback on RMB form
		var form = $('textarea[name="message"]').parents("form");
		form.attr("action", "/page=lodgermbpost/region=" + getVisibleRegion());
		form.submit();
	} else {
		var posting = jQuery.ajax({
			type: "POST",
			url: url,
			data: "chk=" + chkValue + "&message=" + conversion.converted + "&lodge_message=1",
			dataType: "html",
			contentType: "application/x-www-form-urlencoded",
			beforeSend: function(jqXHR) {
				jqXHR.overrideMimeType('text/html;');
			}
		});

		$("#rmb-post-form").animate({ height: 'toggle' }, 1200, function() { $(this).hide(); });
		posting.done(function( data ) {
			if ($(data).find("p[class='error']").length > 0) {
				console.log("Error: " + $(data).find("p[class='error']").text());
				alert($(data).find("p[class='error']").text());
				$("#rmb-post-form").show();
			} else {
				$('textarea[name="message"]').val("");
				$('textarea[name="message"]').height(120).css("min-height", "120px");
				$("#previewcontent").html("");
				if ($("em:contains('There are no lodged messages at present.')").length == 0) {
					if ($("#rmb-search-input").length > 0) {
						setTimeout(function() { $("#rmb-post-form").animate({ height: 'toggle' }, 1200); }, 1200);
					}
					updateRMB();
				} else {
					location.reload();
				}
			}
		});
	}
}

function hasInvalidBBCodes(message) {
	message = message.toLowerCase();
	if (message.count("[i]") != message.count("[/i]")) {
		return true;
	}
	if (message.count("[b]") != message.count("[/b]")) {
		return true;
	}
	if (message.count("[u]") != message.count("[/u]")) {
		return true;
	}
	if (message.count("[region]") != message.count("[/region]")) {
		return true;
	}
	if (message.count("[nation") != message.count("[/nation]")) {
		return true;
	}
	return false;
}

var keywords;
var lastSearchSuccessful = false;
var searchOffset = 0;
var cancelled = false;
function searchRMB(event) {
	if (event.keyCode != 13) {
		return;
	}
	keywords = searchToKeywords($("#rmb-search-input").val());
	//Hide RMB
	var rmb = $('.rmbtable2:last');
	if ($("#rmb-search-results").length == 0) {
		$("<div id='rmb-search-results' style='display: block;' class='rmbtable2'><p></p></div>").insertBefore(rmb);
	} else {
		$("#rmb-search-results").html("<p></p>").height(rmb.height());
	}
	rmb.hide();
	cancelled = false;
	searchOffset = 0;
	doRMBSearch();
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
	$.get(page + "?nspp=1", function(data) {
		if (cancelled) {
			return;
		}
		
		var searchResults = $("#rmb-search-results");
		if (data.length > 14) {
			//Process RMB posts
			$($(data).children()).each( function() {
				var searchResult = searchResults.append($(this).prop("outerHTML"));
				for (var i in keywords) {
					var keyword = keywords[i];
					if (keyword != null && keyword.length > 3) {
						$(searchResult).highlight(keyword);
					}
				}
			});
			searchResults.show()
			searchOffset += 20;
			lastSearchSuccessful = true;
			searchResults.append("<div id='end-of-search-results' class='rmbolder'>End of Search Results</div>");
		} else if (searchOffset > 0) {
			searchResults.append("<div id='end-search-results' class='rmbolder'>End of Search Results</div>");
			lastSearchSuccessful = true;
		} else {
			searchResults.append("<div id='end-search-results' class='rmbolder'>No Search Results</div>");
			lastSearchSuccessful = false;
		}
	});
}

function toggleRMBPostForm() {
	$("#searchbox").hide();
	$('.rmbolder').show();
	if ($("#rmb-post-form:visible").length == 0) {
		$("#rmb-post-form").show();
	} else {
		$("#rmb-post-form").hide();
	}
	$("#rmb-search-results").hide();
	$('.rmbtable2:last').show();
}

function isSearchResultsVisible() {
	return $("#rmb-search-results:visible").length > 0;
}

function toggleSearchForm() {
	if ($("#searchbox:visible").length == 0) {
		$('.rmbolder').hide();
		$("#searchbox").show();
		$("#rmb-post-form").hide();
		if ($("#rmb-search-results").length > 0) {
			$("#rmb-search-results").show();
			$('.rmbtable2:last').hide();
		}
		$("#rmb-search-input").focus();
	} else {
		$('.rmbolder').show();
		$("#searchbox").hide();
		$('.rmbtable2:last').show();
		$("#rmb-search-results").hide();
	}
}

function isAtBottomOfPage() {
	return isInRange($(window).scrollTop() - 5, $(document).height() - $(window).height(), $(window).scrollTop() + (screen.height / 2.5));
}

function showFooterLink() {
	$("#foot #toplink").remove();
	//If footer becomes default positioning it adds 41 more pixels to document size, have to account for that here
	var bottomHeight = (41 * ($("#foot").css("position") == "fixed" ? 1 : 2));
	if ((atEarliestMessage || $("#end-search-results").length == 1) && $(document).scrollTop() + $(window).height() > $(document).height() - bottomHeight) {
		$("#foot").css("position", "inherit");
	} else if ($(document).scrollTop() > ($("#rmb_header").offset().top - 41)) {
		var bottom = -Math.max(0, $("#rmb_header").offset().top - $(document).scrollTop());
		$("#foot").css("position", "fixed").css("margin-left", "194px").css("width", $(window).width() - 194 + "px").css("width", "calc(100% - 194px)").css("bottom", bottom + "px");
	}
}

function handleSearchScroll() {
	if (!isAtBottomOfPage()) {
		return;
	}
	if (lastRMBScroll + 100 > Date.now()) {
		return;
	}
	if (lastSearchSuccessful) {
		if (isSearchResultsVisible() && $("#end-of-search-results").length > 0) {
			$("#end-of-search-results").remove();
			doRMBSearch();
		}
	}
}

var processingRMB = false;
var atEarliestMessage = false;
var _rmboffset = 10;
var lastRMBScroll = Date.now();
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
	if (isSearchResultsVisible()) {
		return;
	}
	if (processingRMB) {
		return;
	}
	processingRMB = true;
	lastRMBScroll = Date.now();
	//Infinite RMB post scroll
	$.get('/page=ajax/a=rmb/region=' + getVisibleRegion() + '/offset=' + _rmboffset + "?nspp=1", function(data) {
		if (data.length > 1) {
			//Format HTML
			var html = "";
			var newPosts = [];
			$($(data).get().reverse()).each( function() {
				if ($("#" +  $(this).attr("id")).length == 0) {
					newPosts.push($(this).attr("id").substring(1));
					html += $(this).prop("outerHTML");
				}
			});
			$(html).insertAfter('.rmbrow:last').hide().show('slow');
			for (var i = 0; i < newPosts.length; i++) {
				var event = jQuery.Event("rmb/update");
				event.postId = newPosts[i];
				$(window).trigger(event);
			}
		} else if (!atEarliestMessage) {
			atEarliestMessage = true;
			$("<div class='rmbolder'>At Earliest Message</div>").insertAfter('.rmbrow:last').hide().show('slow');
		}
		_rmboffset += 10;
	}).fail(function() {
		console.log("RMB Request Failed!");
	}).always(function() {
		processingRMB = false;
	});
}

function updateRMB() {
	//update RMB
	$.get('/page=ajax/a=rmb/region=' + getVisibleRegion() + '/offset=0' + "?nspp=1", function(data) {
		if (data.length > 1 && !isSearchResultsVisible()) {
			var html = "";
			var newPosts = [];
			//Check for new posts
			$($(data).get().reverse()).each(function() {
				if ($(this).find(".rmbsuppressed").length == 0) {
					if ($("#" + $(this).attr("id")).length == 0) {
						newPosts.push($(this).attr("id").substring(1));
						html += $(this).prop("outerHTML");
					} else if ($("#" + $(this).attr("id")).find(".rmbdate").length > 0) {
						$("#" + $(this).attr("id")).find(".rmbdate").html($(this).find(".rmbdate").html());
					}
				}
			});
			//Insert new posts
			if (html.length > 0) {
				var isInfiniteScroll = $(".rmbolder").length == 0;
 				if (isInfiniteScroll) {
					$(html).insertBefore('.rmbrow:first').hide().show('slow');
				} else {
					$(html).insertAfter('.rmbrow:last').hide().show('slow');
				}
				for (var i = 0; i < newPosts.length; i++) {
					var event = jQuery.Event("rmb/update");
					event.postId = newPosts[i];
					$(window).trigger(event);
				}
			}
		}
	});
}

$('body').on('click', 'a.rmbquote', function(event) {
	if ($(".widebox").find("textarea[name='message']:hidden").length > 0) {
		toggleRMBPostForm();
	}
	var quotedPost = $(this).parents(".rmbmsg2");
	var textArea = $("textarea[name='message']");
	setTimeout(function(quotedPost) {
		var textArea = $("textarea[name='message']");
		textArea.val($('<div />').html(textArea.val()).text());
		var height = quotedPost.height();
		textArea.height(Math.max(textArea.height(), height / 2 + 50));
	}, 250, quotedPost);
	$('body,html').animate({scrollTop: textArea.offset().top}, 1000);
});