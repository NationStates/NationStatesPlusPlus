(function() {
	$("<li id='regional_newspaper' style='display:none;'><a style='display: inline;' href='http://www.nationstates.net/page=blank/?regional_news=" + getUserRegion() + "'>REGIONAL NEWS</a></li>").insertAfter($("#live_happenings_feed"));
	$("<li id='gameplay_newspaper'><a style='display: inline;' href='http://www.nationstates.net/page=blank/?gameplay_news'>GAMEPLAY NEWS</a></li>").insertAfter($("#regional_newspaper"));
	$("<li id='roleplay_newspaper'><a style='display: inline;' href='http://www.nationstates.net/page=blank/?roleplay_news'>ROLEPLAY NEWS</a></li>").insertAfter($("#gameplay_newspaper"));
	if (!isSettingEnabled("show_gameplay_news")) {
		$("#gameplay_newspaper").hide();
	}
	if (getUserRegion() != "") {
		$.get("http://capitalistparadise.com/api/newspaper/region/?region=" + getUserRegion(), function(json) {
			$("#regional_newspaper").show();
		});
	}
	
	
	if (window.location.href.indexOf("regional_news") != -1) {
		$.get("http://capitalistparadise.com/api/newspaper/region/?region=" + getUserRegion(), function(json) {
			openNationStatesNews(json.newspaper_id);
		});
	} else if (window.location.href.indexOf("gameplay_news") != -1) {
		openNationStatesNews(0);
	} else if (window.location.href.indexOf("roleplay_news") != -1) {
		openNationStatesNews(1);
	} else if (window.location.href.indexOf("article_editor=") != -1) {
		openArticleEditor($.QueryString["article_editor"], $.QueryString["article"]);
	} else if (window.location.href.indexOf("manage_newspaper=") != -1) {
		openNewspaperAdministration($.QueryString["manage_newspaper"]);
	}

	function openNewspaperAdministration(newspaper) {
		$("#content").html("<div id='news_header' style='text-align: center;'><h1>Newspaper Administration</h1><hr></div><div id='inner-content'><</div>");
		$.get("http://capitalistparadise.com/nationstates/v2_0/newspaper_administration.html", function(html) {
			$("#inner-content").hide();
			$("#inner-content").html(html);
			$.get("http://capitalistparadise.com/api/newspaper/details/?id=" + newspaper, function(data) {
				$("#newspaper_name").val(data.newspaper);
				$("#newspaper_byline").val(data.byline);
				$("#newspaper_editor").val(data.editor);
				$("#newspaper_editor").toggleDisabled();
				$("#newspaper_region").val(data.region != "null" ? data.region : "");
				$("#newspaper_region").toggleDisabled();
				var editors = "";
				console.log(data.editors);
				for (var i = 0; i < data.editors.length; i++) {
					editors += "<option value='" + i + "' name='" + data.editors[i].name + "'>" + data.editors[i].formatted_name + "</option>";
				}
				$("#newspaper_editors").html(editors);
				$("#remove_selected_editors").on("click", function(event) {
					event.preventDefault();
					var selected = $("#newspaper_editors").val();
					for (var i = 0; i < selected.length; i++) {
						var option = $("#newspaper_editors").find("option[value=" + selected[i] + "]");
						console.log(option);
						
					}
				});
				$("#inner-content").show();
			});
		});
	}

	function openArticleEditor(newspaper, article_id) {
		$("#content").html("<div id='news_header' style='text-align: center;'><h1>Newspaper Article Editor</h1><hr></div><div id='inner-content'><</div>");
		$.get("http://capitalistparadise.com/nationstates/v2_0/newspaper_editor.html", function(html) {
			$("#inner-content").html(html);
				$("#submit_article").on("click", function(event) {
				event.preventDefault();
				getNationStatesAuth(function(authCode) {
					var authToken = localStorage.getItem(getUserNation() + "-auth-token");
					var postData = "nation=" + getUserNation() + "&auth=" + authCode + (authToken != null ? "&auth-token=" + authToken : "");
					postData += "&title=" + encodeURIComponent($("#article_title").val());
					postData += "&timestamp=" + Date.now();
					postData += "&author=" + encodeURIComponent($("#article_author").val());
					postData += "&column=" + $("#article_column").val();
					postData += "&order=" + $("#article_order").val();
					postData += "&article=" + encodeURIComponent($("#article_body").val());
					postData += "&visible=" + ($("#article_visible-1").prop("checked") ? "1" : "0");
					$.post("http://capitalistparadise.com/api/newspaper/submit/?newspaper=" + newspaper + "&articleId=" + article_id, postData, function(json) {
						$(".error, .info").remove();
						$("<p class='info'>Article Submitted</p>").insertAfter($("#news_header"));
						$(".info").hide().animate({height: "toggle"}, 600);
					}).fail(function() {
						$(".error, .info").remove();
						$("<p class='error'>Error Submitting Article</p>").insertAfter($("#news_header"));
						$(".error").hide().animate({height: "toggle"}, 600);
					});
				});
			});
			$("#cancel_article").on("click", function(event) {
				event.preventDefault();
				window.location.href = "http://www.nationstates.net/page=blank/?gameplay_news";
			});
			if (article_id > -1) {
				$.get("http://capitalistparadise.com/api/newspaper/lookup/?id=" + newspaper + "&visible=false", function(json) {
					for (var i = 0; i < json.articles.length; i++) {
						var article = json.articles[i];
						if (article.article_id == article_id) {
							console.log(article);
							$("#article_title").val(article.title);
							$("#article_author").val(article.author);
							$("#article_column").val(article.column);
							$("#article_order").val(article.order);
							$("#article_body").html(article.article);
							if (article.visible == "1") {
								$("#article_visible-1").prop("checked", true);
							} else {
								$("#article_visible-0").prop("checked", true);
							}
						}
					}
				});
			}
		});
	}

	function openNationStatesNews(id) {
		localStorage.setItem("last_read_newspaper-" + id, Date.now());
		$("#ns_news_nag").remove();
		$("#content").html("<div id='news_header' style='text-align: center;'><h1 id='newspaper_name'></h1><div id='manage_newspaper' style='display:none; position: absolute; right: 200px; top: 125px;'><p><a class='button' style='font-weight: bold;' href='page=blank/?manage_newspaper=" + id + "'>Manage Newspaper</a></p></div><i id='newspaper_byline'></i><hr></div><div id='inner-content'><div id='left_column' style='position: absolute; width: 25%; padding-right: 0.5%; border-right: solid 1px black;'></div><div style='position: absolute; margin-left: 26%; width: 25%; padding-right: 0.5%; border-right: solid 1px black;' id='middle_column'></div><div id='right_column' style='position: absolute; margin-left: 52%; width: 25%;'></div></div><div id='bottom_content' style='text-align:center;'><i id='submissions' style='display:none;'>Looking to have your article or content featured? Contact <a id='submissions_editor' href='nation=afforess' class='nlink'>Afforess</a> for submissions!</i></div>");
		loadingAnimation();
		window.document.title = "NationStates"
		$(window).unbind("scroll");
		updateSize = function() {
			$("#inner-content").css("height", 0);
			$("#inner-content").children().each(function() {
				var height = $("#inner-content").height();
				$("#inner-content").css("height", Math.max(height, $(this).height() + 200) + "px");
			});
		}
		$.get("http://capitalistparadise.com/api/newspaper/lookup/?id=" + id, function(json) {
			getNationStatesAuth(function(authCode) {	
				var authToken = localStorage.getItem(getUserNation() + "-auth-token");
				var postData = "nation=" + getUserNation() + "&auth=" + authCode + (authToken != null ? "&auth-token=" + authToken : "");
				$.post("http://capitalistparadise.com/api/newspaper/canedit/?newspaper=0", postData, function(data, textStatus, jqXHR) {
					var authToken = jqXHR.getResponseHeader("X-Auth-Token");
					if (authToken != null) {
						localStorage.setItem(getUserNation() + "-auth-token", authToken);
					}
					$(".edit_article").show();
					$("#manage_newspaper").show();
				});
			});
			window.document.title = json.newspaper;
			$("#newspaper_name").html(json.newspaper);
			$("#newspaper_byline").html(json.byline);
			$("#submissions_editor").html(json.editor.replaceAll("_", " ").toTitleCase());
			$("#submissions_editor").attr("href", "nation=" + json.editor);
			
			var getSelector = function(column) {
				switch (parseInt(column, 10)) {
					case 0:
						return $("#left_column");
					case 1:
						return $("#middle_column");
					case 2:
						return $("#right_column");
				}
			}
			var articles = json.articles;
			$("#left_column, #middle_column, #right_column").html("");
			for (var order = 0; order < 5; order++) {
				for (var i = 0; i < articles.length; i++) {
					var article = articles[i];
					if (article.order == order) {
						var selector = getSelector(article.column);
						if (order > 0) selector.append("<hr style='margin-top: 40px;'>");
						selector.append("<div newspaper='" + article.newspaper + "' id='article_id_" + article.article_id + "' style='white-space: pre;'></div>");
					}
				}
			}
			for (var i = 0; i < articles.length; i++) {
				var article = articles[i];
				var selector = $("#article_id_" + article.article_id);
				var html = "<h2 style='margin-top:-5px;margin-bottom:-15px'>" + article.title + "</h2>";
				html += "<i><p>" + article.author + ", " + (new Date(parseInt(article.timestamp, 10))).customFormat("#D##th# #MMMM# #YYYY#") + "</p></i>";
				html += "<div class='edit_article' style='display:none; margin-top:-12px;'><p><a class='button' href='page=blank/?article_editor=" + article.newspaper + "&article=" + article.article_id + "'>Edit Article</a></p></div>";
				var text = article.article;
				text = text.replaceAll("[b]", "<b>").replaceAll("[/b]", "</b>");
				text = text.replaceAll("[i]", "<i>").replaceAll("[/i]", "</i>");
				text = text.replaceAll("[u]", "<u>").replaceAll("[/u]", "</u>");
				text = text.replaceAll("[blockquote]", "<blockquote class='news_quote'>").replaceAll("[/blockquote]", "</blockquote>");
				text = parseUrls(text);
				text = updateTextLinks("nation", text);
				text = updateTextLinks("region", text);
				html += text;
				selector.html(html);
			}
			window.onresize();
		});
		$("#submissions").show();
		window.onresize = updateSize;
	}

	function loadingAnimation() {
		if ($(".loading_animation").length > 0) {
			$(".loading_animation").each(function() {
				var frame = $(this).attr("frame");
				frame = (frame != null ? parseInt(frame) : 0);
				frame += 1;
				if (frame > 18) frame = 0;
				$(this).attr("frame", frame);
				$(this).css("background-position", frame * -128 + "px 0px");
			});
			setTimeout(loadingAnimation, 50);
		}
	}

	function updateTextLinks(tag, text) {
		var index = text.indexOf("[" + tag + "]");
		while (index > -1) {
			var endIndex = text.indexOf("[/" + tag + "]", index + tag.length + 2);
			if (endIndex == -1) {
				break;
			}
			var innerText = text.substring(index + tag.length + 2, endIndex);
			text = text.substring(0, index) + "<a target='_blank' href='/" + tag + "=" + innerText.toLowerCase().replaceAll(" ", "_") + "'>" + innerText + "</a>" + text.substring(endIndex + tag.length + 3);
			index = text.indexOf("[" + tag + "]", index);
		}
		return text;
	}

	function parseUrls(text) {
		var index = text.indexOf("[url=");
		while (index > -1) {
			var endIndex = text.indexOf("[/url]", index + 6);
			if (endIndex == -1) {
				break;
			}
			var innerText = text.substring(index + 5, endIndex);
			var url = innerText.substring(innerText.indexOf("=") + 1, innerText.indexOf("]"));
			
			text = text.substring(0, index) + "<a target='_blank' href='" + url + "'>" + innerText.substring(innerText.indexOf("]")) + "</a>" + text.substring(endIndex + 6);
			index = text.indexOf("[url=", index);
		}
		return text;
	}
})();