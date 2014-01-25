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
	if (getSettings().isEnabled("auto_update")) {
		checkForRMBUpdates(10000);
	}

	if (getSettings().isEnabled("infinite_scroll")) {
		$(".rmbolder").remove();
	}
	addUpdateTime();
	
	var rmbSearchEnabled = getSettings().isEnabled("search_rmb") && $("em:contains('There are no lodged messages at present.')").length == 0;
	
	var founder = $("strong:contains('Founder'):first");
	
	//Add link to region controls
	var rControls = $("a[href='page=region_control/region=" + getVisibleRegion() + "']");
	if (rControls.length > 0) {
		$("<a href='page=region_admin/region=" + getVisibleRegion() + "'>Administration</a><span> &#8226; </span>").insertBefore(rControls);
		rControls.html("Regional Controls");
		
		var userIsFounder = (founder.length > 0 && (typeof founder.next().attr("href") != "undefined") && founder.next().attr("href").substring(7) == getUserNation());
		$("<span> &#8226; </span><a name='rc' href='page=blank/?banhammer=" + getVisibleRegion() + (userIsFounder ? "&free=true" : "") + "'>Banhammer</a>").insertAfter(rControls);
	} else {
		rControls = $("a[href='page=region_admin/region=" + getVisibleRegion() + "']");
		$("<span> &#8226; </span><a name='rc' href='page=region_control/region=" + getVisibleRegion() + "'>Regional Controls</a>").insertAfter(rControls);
	}
	//Add FA icons
	$("strong:contains('WA Delegate'):first").html("<i class='fa fa-users'></i> <span id='wa_delegate_title'>WA Delegate</span>");
	if (founder.length > 0) {
		$("strong:contains('Founder'):first").html("<i class='fa fa-star'></i> <span id='founder_title'>Founder</span>");
	} else {
		founder = $("strong:contains('WA Delegate'):first");
	}
	$.get("http://nationstatesplusplus.net/api/region/title/?region=" + getVisibleRegion(), function(data) {
		if (data.delegate_title != null) {
			$("#wa_delegate_title").html($("<div></div>").html(data.delegate_title).text());
		}
		if (data.founder_title != null) {
			$("#founder_title").html($("<div></div>").html(data.founder_title).text());
		}
	});
	$.get("http://nationstatesplusplus.net/api/newspaper/region/?region=" + getVisibleRegion(), function(json) {
		$("<p><strong><img style='height: 13px;' src='http://nationstatesplusplus.net/nationstates/static/" + (document.head.innerHTML.indexOf("ns.dark") != -1 ? "dark_" : "") + "newspaper_icon.png'> Newspaper: </strong><a id='rnewspaper_link'><a></p>").insertAfter(founder.parent());
		$("#rnewspaper_link").html(parseBBCodes(json.title)).attr("href", "/page=blank?lookup_newspaper=" + json.newspaper_id);
		$("strong:contains('WA Delegate'):first").parent().css("min-height", "0px");
	});
	
	var changeRegion = $("a[href='page=change_region']");
	if (changeRegion.length > 0) {
		changeRegion.addClass("button");
	}
	
	var regionalPower = $("strong:contains('Regional Power:')");
	if (regionalPower.length > 0) {
		regionalPower.html("<i class='fa fa-bolt'></i> " + regionalPower.html().substring(9));
		var parent = regionalPower.parent();
		parent.addClass("regional_power");
		parent.css("right", Math.max($("img.rflag:first").width() - parent.width() + 8, 20) + "px");
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
		population.html("<strong><i class='fa fa-bar-chart-o'></i> Population: </strong>" + population.html());
		
		//Regional Maps
		$("<p id='region_map' style='display:none; height: 10px;'><img src='http://nationstatesplusplus.net/nationstates/static/" + (document.head.innerHTML.indexOf("ns.dark") != -1 ? "dark_" : "") + "map3.png' style='width: 16px;'><span style='position: relative; top: -5px;'><strong> Map: </strong><span id='regional_map_link'></span></span></p>").insertAfter(population);
		//Fetch region map
		$.get("http://nationstatesplusplus.net/api/region/map/?region=" + getVisibleRegion(), function(data) {
			if (data.regional_map != null) {
				$("#regional_map_link").html("<a href='" + data.regional_map + "' target='_blank'>Regional Map of " + getVisibleRegion().replaceAll("_", " ").toTitleCase() + "</a>");
				$("#regional_map_link").attr("preview", data.regional_map_preview);
				
				//Create floating div
				$(document.body).append("<div id='regional_map_preview' style='display:none;'></div>");
				$("#regional_map_preview").html("<a href='" + $("#regional_map_link").attr("preview") + "' target='_blank'><img src='" + $("#regional_map_link").attr("preview") + "' style='max-width:500px; max-height:600px; margin-bottom: -3px;'></a>");
				$("#region_map").show();
				
				if (getSettings().isEnabled("show_regional_map_preview")) {
					$("#regional_map_link").on("mouseenter", function(event) {
						if ($("#regional_map_preview:visible").length == 0) {
							$("#regional_map_preview").show();
							$("#regional_map_preview").css("position", "absolute").css("left", "200px").css("top", $("#regional_map_link").offset().top + $("#regional_map_link").height());
							if (document.head.innerHTML.indexOf("ns.dark") != -1) {
								$("#regional_map_preview").css("border", "2px solid white");
							} else {
								$("#regional_map_preview").css("border", "2px solid grey");
							}
							$("#regional_map_preview").on("mouseenter", function(event) {
								$("#regional_map_preview").show();
							});
							$("#regional_map_preview").on("mouseleave", function(event) {
								$("#regional_map_preview").hide();
							});
						}
					});
					$("#regional_map_link").on("mouseleave", function(event) {
						$("#regional_map_preview").hide();
					});
				}
			}
		});
	}
	
	$("p:contains('Construction of embassies with')").each(function() {
		$(this).html("<i style='margin-right:4px;' class='fa fa-cog'></i>" + $(this).html());
	});
	$("p:contains('is being withdrawn. Closure expected in')").each(function() {
		$(this).html("<i style='margin-right:4px;' class='fa fa-exclamation-triangle'></i>" + $(this).html());
	});

	rControls.parent().html("<i style='margin-right:4px;' class='fa fa-wrench'></i>" + rControls.parent().html());

	if (isAntiquityTheme()) {
		var html = "<tr>" + $("tbody:last").children(":first").html() + "</tr>";
		var children;
		if (getSettings().isEnabled("infinite_scroll")) {
			children = $("tbody:last").children(":not(:first)").get().reverse();
		} else {
			children = $("tbody:last").children(":not(:first)").get();
		}
		$(children).each( function() {
			html += parseRMBPost($(this).html(), $(this).attr('class'));
		});
		$("tbody:last").html(html);
	} else {
		if (getSettings().isEnabled("show_all_suppressed_posts")) {
			$(window).on("rmb/update", function(event, post) {
				post.find(".hide").show();
			});
		}
		
		$(window).on("rmb/update", function(event, post) {
			post.find(".rmbauthor2").find("p:contains('Afforess')").each(function() {
				if ($(this).html() == "Afforess") {
					$(this).html("<a href='nation=shadow_afforess' class='nlink'><span>The Free Republic of Afforess</span></a>");
					$(this).next().prepend("<img src='http://nationstatesplusplus.net/api/flag/nation/?nation=the_office_of_afforess' class='smallflag' title='The Free Republic of Afforess'>");
				}
			});
		});

		$(document.body).append("<div id='rmb_cache' cache='-1'></div>");
		$.get("http://nationstatesplusplus.net/api/rmb/cache/?region=" + getVisibleRegion(), function(data) {
			$("#rmb_cache").attr("cache", data.rmb_cache);
		});

		$(window).on("rmb/update", function(event, post) {
			var id = post.attr("id").split("-")[post.attr("id").split("-").length - 1];
			post.find(".rmbmsg2").append("<div postid='" + id + "' class='post-ratings'><ul class='post-rating-list' style='opacity: 0;'><li class='undo-rating' style='display:none;'><a href='javascript:void(0)'>Undo Rating</a></li><li name='like'><a href='javascript:void(0)'><img style='margin-right: 3px;' src='http://nationstatesplusplus.net/nationstates/static/like.png' alt='Like'></a></li><li name='dislike'><a href='javascript:void(0)'><img style='margin-right: 3px;' src='http://nationstatesplusplus.net/nationstates/static/dislike2.png' alt='Dislike'></a></li></ul></div>");
			setTimeout(function(post) {
				var authorHeight = post.find(".rmbauthor2").height() + 17;
				var msgHeight = post.find(".rmbmsg2").height();
				if (authorHeight > msgHeight) {
					post.find(".post-ratings").attr("style", "margin-top: " + (authorHeight - msgHeight) + "px;");
				}
			}, 500, post);
			var calculateRatings = function(post, id) {
				$.get("http://nationstatesplusplus.net/api/rmb/rate/get/?rmbPost=" + id + "&rmbCache=" + $("#rmb_cache").attr("cache"), function(data) {
					var likes = 0;
					var dislikes = 0;
					var rating = -1;
					for (var i = 0; i < data.length; i++) {
						if (data[i].type == 0) dislikes += 1;
						else if (data[i].type == 1) likes += 1;
						if (data[i].nation.toLowerCase().replaceAll(" ", "_") == getUserNation()) {
							rating = data[i].type;
						}
					}
					post.find(".post-ratings").find("span[name='rating-container']").remove();
					post.find(".post-ratings").prepend("<span name='rating-container'></span>");
					if (rating > -1) {
						post.find(".post-rating-list").find("li").hide();
						post.find(".undo-rating").show();
					}
					if (dislikes > 0) {
						post.find("span[name='rating-container']").prepend("<img src='http://nationstatesplusplus.net/nationstates/static/dislike2.png' alt='Dislike'><span amt='" + dislikes + "' " + (rating == 0 ? "rated='1'" : "") + " class='post-rating-desc'>Dislike x " + dislikes + "</span>");
					}
					if (likes > 0) {
						post.find("span[name='rating-container']").prepend("<img src='http://nationstatesplusplus.net/nationstates/static/like.png' alt='Like'><span amt='" + likes + "' " + (rating == 1 ? "rated='1'" : "") + " class='post-rating-desc'>Like x " + likes + "</span>");
					}
				});
			};
			calculateRatings(post, id);
			if (getUserRegion() != getVisibleRegion()) {
				return;
			}
			post.on("mouseenter", function(e){
				$(e.currentTarget).find(".post-rating-list").stop().animate({opacity:"1.0"},200);
			});
			post.on("mouseleave", function(e){
				$(e.currentTarget).find(".post-rating-list").stop().animate({opacity:"0"},200);
			});
			post.find("li[name='like']").find("a").on("click", function (e) {
				e.preventDefault();
				var id = $(this).parents(".post-ratings:first").attr("postid");
				var post = $("#rmb-post-" + id);
				doAuthorizedPostRequest("http://nationstatesplusplus.net/api/rmb/rate/set/?rmbPost=" + id + "&rating=1", "", function(data, textStatus, jqXHR) {
					$("#rmb_cache").attr("cache", parseInt($("#rmb_cache").attr("cache")) + 1);
					calculateRatings(post, id);
				});
			});
			post.find("li[name='dislike']").find("a").on("click", function (e) {
				e.preventDefault();
				var id = $(this).parents(".post-ratings:first").attr("postid");
				var post = $("#rmb-post-" + id);
				doAuthorizedPostRequest("http://nationstatesplusplus.net/api/rmb/rate/set/?rmbPost=" + id + "&rating=0", "", function(data, textStatus, jqXHR) {
					$("#rmb_cache").attr("cache", parseInt($("#rmb_cache").attr("cache")) + 1);
					calculateRatings(post, id);
				});
			});
			post.find(".undo-rating").find("a").on("click", function(event) {
				event.preventDefault();
				var id = $(this).parents(".post-ratings:first").attr("postid");
				var post = $("#rmb-post-" + id);
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
				doAuthorizedPostRequest("http://nationstatesplusplus.net/api/rmb/rate/set/?rmbPost=" + id + "&rating=-1", "");
			});
		});

		var html = "";
		var children;
		if (getSettings().isEnabled("infinite_scroll")) {
			children = $(".rmbtable2").children().get().reverse();
		} else {
			children = $(".rmbtable2").children().get();
		}
		var postIds = []
		$(children).each( function() {
			postIds.push(getRMBPostId($(this).html()));
			html += parseRMBPost($(this).html(), $(this).attr('class'));
		});
		$(".rmbtable2").html(html);

		//Fix nasty css
		$(".small").attr("class", "button");
		$(".hilite").attr("class", "button");
		var dossier = $("input[type='submit'].button");
		$("input[type='submit'].button").each(function() {
			$(this).html($(this).val()).changeElementType("button")
		});
		//Trim off the 'Tired of life in...' crap
		var passworded = $("img[alt='Password required']").length > 0;
		console.log("passworded: " + passworded);
		var moveRegion = $("button[name='move_region']");
		if (moveRegion.length > 0) {
			moveRegion.parent().html(moveRegion[0].outerHTML + "<input type='password' placeholder='Region Password' class='region_password text-input' style='display:none;' id='region_password_input'><span id='invalid-pass' style='display:none; margin-left: 7px; color:red;'>Invalid Password'</span>");
			if (passworded) {
				$("button[name='move_region']").addClass("button-warning").addClass("icon").addClass("lock");
			}
		}
		//Remove silly redirect
		$("button[name='move_region']").on("click", function(event) {
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
			$.post("http://www.nationstates.net/page=change_region", "localid=" + $("input[name='localid']").val() + "&region_name=" + $("input[name='region_name']").val()
																	+ "&move_region=1" + (password.length > 0 ? "&password=" + password : ""), function(data) {
				if (data.toLowerCase().contains("you have not entered the correct password")) {
					$("#invalid-pass").html("Your password is incorrect!").show();
					$("button[name='move_region']").attr("disabled", false);
				} else if (data.toLowerCase().contains("you have been temporarily blocked from moving into password-protected regions.")) {
					$("#invalid-pass").html("You repeatedly entered the wrong password, so you have been temporarily blocked from password-protected regions.").show();
					$("#region_password_input").attr("disabled", true);
					$("button[name='move_region']").attr("disabled", true);
				} else {
					$("button[name='move_region']").attr("disabled", false);
					window.location.href = "http://www.nationstates.net/region=" + $("input[name='region_name']").val();
				}
			}).fail(function(data) {
				$("button[name='move_region']").attr("disabled", false);
				$("#content").html($(data).find("#content"));
			});
		});

		//Trigger post event for existing posts
		for (var i = 0; i < postIds.length; i++) {
			setTimeout(function(postId) {$(window).trigger("rmb/update", [ $("#rmb-post-" + postId) ]); }, 500, postIds[i]);
		}
	}

	if (getSettings().isEnabled("infinite_scroll") || rmbSearchEnabled) {
		var formHtml = "<div id='rmb-post-form' style='display: none;'><div style='text-align:center;'><p>You need to " + (getUserNation().length > 0 ?  "move to the region" : "login to NationStates") + " first!</p></div></div>";
		//Move the RMB reply area to the top
		var rmbPost = document.forms["rmb"];
		if (typeof rmbPost != 'undefined') {
			//Remove the "From:" line
			$(rmbPost).children().each( function() {
				if ($(this).html().indexOf("From:") > -1) {
					$(this).remove();
				}
			});

			//Move the post form to the top
			var formHtml = "<div id='rmb-post-form'><form id='rmb'>" + rmbPost.innerHTML + "</form></div>";
			$(rmbPost).remove();
		}
		$('.widebox:last').prepend(formHtml);
		if (rmbSearchEnabled) {
			$("#rmb-post-form").hide();
		}
	}
	if (!getSettings().isEnabled("infinite_scroll")) {
		//Override older rmb click
		var olderRMB = $('#olderrmb').prop('outerHTML')
		var olderParent = $('#olderrmb').parent();
		$('#olderrmb').remove();
		olderParent.append(olderRMB.replaceAll("olderrmb", "older_rmb"));
		$('#older_rmb').click(function(event){
			event.preventDefault();
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
							html += parseRMBPost($(this).html(), $(this).attr('class'));
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

	//Move "Switch to Forum View" to top of RMB posts
	if (getSettings().isEnabled("infinite_scroll")) {
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
	} else if (rmbSearchEnabled) {
		$('.rmbolder').css("margin-top", "20px");
	}

	//Setup infinite scroll
	$(window).scroll(handleInfiniteScroll);

	if (rmbSearchEnabled) {
		var wideboxArea = $(".widebox:contains('Switch to Forum View')");
		//Add rmb menu area
		$("<div id='rmb-menu' style='text-align: center;'><button class='button RoundedButton rmb-message'>Leave a message</button> <button class='button RoundedButton search-rmb'>Search messages</button></div").insertBefore(wideboxArea);

		//Add search box
		$("<div id='searchbox' style='display: none;'><div style='margin-top:6px; text-align:center;'><input id='rmb-search-input' placeholder='Search' type='text' style='width:36.5%;' class='text-input-lg' name='googlesearch'><p><input id='rmb-search-input-region' placeholder='Region' type='text' style='width:16.5%; margin-right: 2%;'  class='text-input-lg' name='googlesearch'><input id='rmb-search-input-author' placeholder='Author' type='text' style='width:16.5%;' class='text-input-lg' name='googlesearch'><p></div></div>").insertBefore(wideboxArea);

		$("button.rmb-message").on("click", toggleRMBPostForm);
		$("button.search-rmb").on("click", toggleSearchForm);
		$("#rmb-search-input, #rmb-search-input-region, #rmb-search-input-author").on("keydown", searchRMB);
		if (isAntiquityTheme()) {
			$("#rmb-menu").css("margin-bottom", "20px");
			$("#rmb-search-input").css("margin-bottom", "20px");
		}
	}
	$("button[name='lodge_message']").on("click", doRMBPost);

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
				getSettings(true).setValue("show_world_census", true);
			} else {
				$("#census_report_container").hide();
				$("a.toggle-census-report").html("(Show)");
				getSettings(true).setValue("show_world_census", false);
			}
		});

		if (!getSettings().isEnabled("show_world_census")) {
			$("#census_report_container").hide();
			$("a.toggle-census-report").html("(Show)");
		}

		$("<h2>Regional Population <a style='font-family: Verdana,Tahoma; font-size: 10pt; margin-left: 10px;' class='toggle-pop-report' href='#'>(Hide)</a></h2><div id='regional-pop'></div><div class='hzln'></div>").insertAfter($("#census_report_container").next());

		$("<div id='highcharts_graph' graph='region_chart' region='" + getVisibleRegion() + "' title='" + getVisibleRegion().replaceAll("_", " ").toTitleCase() + "'></div>").insertAfter($("#census_report_container"));

		$("a.toggle-pop-report").click(function(event) {
			event.preventDefault();
			if ($("#regional-pop:visible").length == 0) {
				$("#regional-pop").show();
				$("a.toggle-pop-report").html("(Hide)");
				getSettings(true).setValue("show_regional_population", true);
				$("<div id='highcharts_graph' graph='set_chart_size' width='" + $("#regional-pop").width() + "' height='" + 400 + "'></div>").insertAfter($("#census_report_container"));
			} else {
				$("#regional-pop").hide();
				$("a.toggle-pop-report").html("(Show)");
				getSettings(true).setValue("show_regional_population", false);
			}
		});
		if (!getSettings().isEnabled("show_regional_population")) {
			$("#regional-pop").hide();
			$("a.toggle-pop-report").html("(Show)");
		}
	}
}

function addUpdateTime() {
	$.get("http://nationstatesplusplus.net/api/region/updatetime/?region=" + getVisibleRegion() + "&v=1", function(data) {
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
			text = "<span class='updatetime'>Next Update: " +  (new Date(nextUpdate)).customFormat("#hh#:#mm#:#ss# #AMPM#") + " [&plusmn; " + Math.floor(update.std * 2 / 1000) + " s]</span>"
			$("h1:first").html($("h1:first").html() + text);
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
			if (ch <= 0x7F || (ch >= 0xA0 && ch <= 0xFF)) {
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
	if (conversion.error || (getVisibleRegion() == "brasil" && !window.chrome)) {
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
			contentType: "application/x-www-form-urlencoded;",
			beforeSend: function(jqXHR) {
				jqXHR.overrideMimeType('text/html;');
			}
		});

		$("#rmb-post-form").animate({ height: 'toggle' }, 1200, function() { $(this).hide(); });
		posting.done(function( data ) {
			if ($(data).find("p[class='error']").length > 0) {
				console.log("Error: " + $(data).find("p[class='error']").text());
				alert($(data).find("p[class='error']").text());
			} else {
				$.get('/region=' + getVisibleRegion(), function(data) {
					$("#rmb").html($(data).find("#rmb").html());
					$('textarea[name="message"]').val("");
					$('textarea[name="message"]').height(120);
					$("#previewcontent").html("");
					if ($("em:contains('There are no lodged messages at present.')").length == 0) {
						updateRMB();
					} else {
						location.reload();
					}
				});
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
	var searchWords = document.getElementById("rmb-search-input").value;
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
				var searchResult = $(searchResults).append(parseRMBPostWithId($(this).html(), $(this).attr('class'), getRMBPostId($(this).html()) + "-search"));
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

function isSearchResultsVisible() {
	return $("#rmb-search-results:visible").length > 0;
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
	} else if (getSettings().isEnabled("infinite_scroll") && !processingRMB) {
		processingRMB = true;
		lastRMBScroll = Date.now();
		//Infinite RMB post scroll
		var request = $.get('/page=ajax/a=rmb/region=' + getVisibleRegion() + '/offset=' + _rmboffset, function(data) {
			if (data.length > 1) {
				//Format HTML
				var html = "";
				var newPosts = [];
				$($(data).get().reverse()).each( function() {
					var postId = getRMBPostId($(this).html());
					var rmbPost = document.getElementById("rmb-post-" + postId);
					if (rmbPost === null) {
						newPosts.push(postId);
						html += parseRMBPost($(this).html(), $(this).attr('class'));
					}
				});
				$(html).insertAfter('.rmbrow:last').hide().show('slow');
				for (var i = 0; i < newPosts.length; i++) {
					$(window).trigger("rmb/update", [ $("#rmb-post-" + newPosts[i]) ]);
				}
			} else if (!atEarliestMessage) {
				atEarliestMessage = true;
				$("<div class='rmbolder'>At Earliest Message</div>").insertAfter('.rmbrow:last').hide().show('slow');
			}
			_rmboffset += 10;
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
			var newPosts = [];
			//Check for new posts
			$($(data).get().reverse()).each(function() {
				if ($(this).find(".rmbsuppressed").length == 0) {
					var postId = getRMBPostId($(this).html());
					var rmbPost = document.getElementById("rmb-post-" + postId);
					if (rmbPost === null) {
						newPosts.push(postId);
						html += parseRMBPost($(this).html(), $(this).attr('class'));
					} else if ($(rmbPost).find(".rmbdate").html() != "undefinied") {
						$(rmbPost).find(".rmbdate").html($(this).find(".rmbdate").html());
					}
				}
			});
			//Insert new posts
			if (html.length > 0) {
				if (getSettings().isEnabled("infinite_scroll") || getSettings().isEnabled("search_rmb")) {
					$(html).insertBefore('.rmbrow:first').hide().show('slow');
				} else {
					$(html).insertAfter('.rmbrow:last').hide().show('slow');
				}
				for (var i = 0; i < newPosts.length; i++) {
					$(window).trigger("rmb/update", [ $("#rmb-post-" + newPosts[i]) ]);
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

function parseRMBPost(innerHTML, className) {
	return parseRMBPostWithId(innerHTML, className, getRMBPostId(innerHTML));
}

function parseRMBPostWithId(innerHTML, className, postId) {
	if (getSettings().isEnabled("clickable_links")) {
		innerHTML = linkify(innerHTML);
	}

	//Add inner body div
	var innerBody = innerHTML.indexOf('<div class="rmbspacer"></div>');

	var isPostVisible = postId.indexOf("-search") == -1 && innerHTML.indexOf('rmbbuttons') == -1 && innerHTML.indexOf('rmbsuppressed') == -1;
	if (isPostVisible && localStorage.getItem("ignored-post-" + postId) == "true" && getSettings().isEnabled("show_ignore")) {
		innerHTML = "<div id='rmb-inner-body-" + postId + "' style='display:none;'>" + innerHTML.substring(0, innerBody) + "</div>" + innerHTML.substring(innerBody);
	} else {
		innerHTML = "<div id='rmb-inner-body-" + postId + "'>" + innerHTML.substring(0, innerBody) + "</div>" + innerHTML.substring(innerBody);
	}

	if (isPostVisible && getSettings().isEnabled("show_ignore")) {
		//Add ignore button
		innerHTML = '<div style="margin-top:6px;" class="rmbbuttons"><a href="" class="forumpaneltoggle rmbignore"><img src="http://nationstatesplusplus.net/nationstates/static/rmb_ignore.png" alt="Ignore" title="Ignore Post"></a></div>' + innerHTML;

		if (localStorage.getItem("ignored-post-" + postId) == "true") {
			innerHTML += "<div id='rmb-ignored-body-" + postId + "' class='rmbsuppressed' style='margin-top:-16px; padding-bottom:6px;'>Ignored post.</div>";
		}
	}

	if (isAntiquityTheme()) {
		var index = innerHTML.lastIndexOf("</td>");
		innerHTML = innerHTML.substring(0, index) + quoteHTML + "</td>" + innerHTML.substring(index + 4);
		return ("<tr id='rmb-post-" + postId + "' class='" + className + "'>" + innerHTML + "</tr>");
	}
	return ("<div id='rmb-post-" + postId + "' class='" + className + "' style='display: block;'>" + innerHTML + "</div>");
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