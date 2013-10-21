(function() {
	var menu = $(".menu");
	$("<li id='regional_newspaper' style='display:none;'><a id='rnews' style='display: inline;' href='http://www.nationstates.net/page=blank/?regional_news=" + getUserRegion() + "'>REGIONAL NEWS</a></li>").insertAfter(menu.find("a[href='page=un']").parent());
	$("<li id='gameplay_newspaper'><a id='gnews' style='display: inline;' href='http://www.nationstates.net/page=blank/?gameplay_news'>GAMEPLAY NEWS</a></li>").insertAfter($("#regional_newspaper"));
	$("<li id='roleplay_newspaper'><a id='rpnews' style='display: inline;' href='http://www.nationstates.net/page=blank/?roleplay_news'>ROLEPLAY NEWS</a></li>").insertAfter($("#gameplay_newspaper"));
	if (!isSettingEnabled("show_gameplay_news")) {
		$("#gameplay_newspaper").hide();
	}
	if (!isSettingEnabled("show_roleplay_news")) {
		$("#roleplay_newspaper").hide();
	}
	if (!isSettingEnabled("show_regional_news")) {
		$("#regional_newspaper").hide();
	}
	if (getUserRegion() != "") {
		$.get("http://capitalistparadise.com/api/newspaper/region/?region=" + getUserRegion(), function(json) {
			$("#regional_newspaper").show();
			$("#regional_newspaper").attr("news-id", json.newspaper_id);
		});
	}

	if (window.location.href.indexOf("regional_news") != -1) {
		$.get("http://capitalistparadise.com/api/newspaper/region/?region=" + $.QueryString["regional_news"], function(json) {
			openNationStatesNews(json.newspaper_id);
		}).fail(function() {
			$("#content").html("<div id='news_header' style='text-align: center;'><h1>Newspaper</h1><hr></div><div id='inner-content' style='text-align:center'>No regional newspaper exists for " + $.QueryString["regional_news"].replaceAll("_", " ").toTitleCase() + "! Contact their delegate or founder to establish one.</div>");
		});
	} else if (window.location.href.indexOf("lookup_newspaper") != -1) {
		openNationStatesNews($.QueryString["lookup_newspaper"]);
	} else if (window.location.href.indexOf("gameplay_news") != -1) {
		openNationStatesNews(0);
	} else if (window.location.href.indexOf("roleplay_news") != -1) {
		openNationStatesNews(1);
	} else if (window.location.href.indexOf("article_editor=") != -1) {
		openArticleEditor($.QueryString["article_editor"], $.QueryString["article"]);
	} else if (window.location.href.indexOf("manage_newspaper=") != -1) {
		openNewspaperAdministration($.QueryString["manage_newspaper"]);
	} else if (window.location.href.indexOf("view_articles=") != -1) {
		viewNewspaperArticles($.QueryString["view_articles"]);
	}
	
	function updateNewspaperNags() {
		var checkUpdates = function(id, selector) {
			$.get("http://capitalistparadise.com/api/newspaper/latest/?id=" + id, function(json) {
				var lastRead = localStorage.getItem("last_read_newspaper-" + id);
				var menu = $("#" + selector);
				if (lastRead == null || json.timestamp > parseInt(lastRead)) {
					if (menu.find("span[name='nag']").length == 0) {
						menu.html(menu.html() + "<span name='nag'> (1)</span>");
					}
				} else {
					menu.find("span[name='nag']").remove();
				}
			});
		}
		if (isSettingEnabled("show_gameplay_news")) {
			checkUpdates(0, "gnews");
		}
		if (isSettingEnabled("show_roleplay_news")) {
			checkUpdates(1, "rpnews");
		}
		if (isSettingEnabled("show_regional_news")) {
			if ($("#regional_newspaper").attr("news-id") != null) {
				checkUpdates($("#regional_newspaper").attr("news-id"), "rnews");
			}
		}
	}
	$(window).on("page/update", updateNewspaperNags);
	
	function viewNewspaperArticles(newspaper) {
		window.document.title = "NationStates | Newspaper"
		$("#content").html("<div id='news_header' style='text-align: center;'><h1>Newspaper Article Database</h1><hr></div><div id='inner-content'></div>");
		getNationStatesAuth(function(authCode) {	
			var authToken = localStorage.getItem(getUserNation() + "-auth-token");
			var postData = "nation=" + getUserNation() + "&auth=" + authCode + (authToken != null ? "&auth-token=" + authToken : "");
			$.post("http://capitalistparadise.com/api/newspaper/canedit/?newspaper=" + newspaper, postData, function(data, textStatus, jqXHR) {
				var authToken = jqXHR.getResponseHeader("X-Auth-Token");
				if (authToken != null) {
					localStorage.setItem(getUserNation() + "-auth-token", authToken);
				}
				$.get("http://capitalistparadise.com/api/newspaper/lookup/?id=" + newspaper + "&visible=false&hideBody=true", function(json) {
					var articles = json.articles;
					var html = "";
					for (var i = 0; i < articles.length; i++) {
						var article = articles[i];
						html += "<div class='article_summary'><div style='position:absolute; right: 20px;'><a class='btn edit_article' href='page=blank/?article_editor=" + article.newspaper + "&article=" + article.article_id + "'>Edit Article</a></div><b>Article: </b>" + parseBBCodes(article.title) + "<br/><b>Author: </b>" + parseBBCodes(article.author) + "</br><b>Last Edited: </b>" + (new Date(parseInt(article.timestamp, 10))).customFormat("#D##th# #MMMM# #YYYY#") + "</div>"
					}
					$("button[name='edit_article']").on("click", function(event) {
						event.preventDefault();
						var articleId = $(this).attr("id");
						
					});
					$("#inner-content").html(html);
				});
			}).fail(function() {
				$("#inner-content").html("<span style='color:red'>You do not have permission to view the article database for this newspaper!</span>");
			});
		});
	}

	function openNewspaperAdministration(newspaper) {
		window.document.title = "NationStates | Newspaper"
		$("#content").html("<div id='news_header' style='text-align: center;'><h1>Newspaper Administration</h1><hr></div><div id='inner-content'></div>");
		$.get("http://capitalistparadise.com/nationstates/v2_0/newspaper_administration.html", function(html) {
			$("#inner-content").hide();
			$("#inner-content").html(html);
			$.get("http://capitalistparadise.com/api/newspaper/details/?id=" + newspaper, function(data) {
				$("#newspaper_name").val(data.newspaper);
				$("#newspaper_name").attr("newspaper_id", newspaper);
				$("#newspaper_byline").val(data.byline);
				$("#newspaper_editor").val(data.editor.replaceAll("_", " ").toTitleCase());
				$("#newspaper_editor").attr("name", data.editor);
				$("#newspaper_editor").toggleDisabled();
				$("#newspaper_region").val(data.region != "null" ? data.region : "");
				$("#newspaper_region").toggleDisabled();
				var editors = "";
				for (var i = 0; i < data.editors.length; i++) {
					editors += "<option value='" + i + "' name='" + data.editors[i].name + "'>" + data.editors[i].formatted_name + "</option>";
				}
				$("#newspaper_editors").html(editors);
				$("#remove_selected_editors").on("click", function(event) {
					event.preventDefault();
					var selected = $("#newspaper_editors").val();
					for (var i = 0; i < selected.length; i++) {
						$("#editor-warning").hide();
						var option = $("#newspaper_editors").find("option[value=" + selected[i] + "]");
						if (option.attr("name") != $("#newspaper_editor").attr("name")) {
							console.log(option);
							var removed = (typeof $("#newspaper_editors").attr("remove") != "undefined" ? $("#newspaper_editors").attr("remove") : "");
							$("#newspaper_editors").attr("remove", removed + (removed.length > 0 ? "," : "") + option.attr("name"));
							option.remove();
						} else {
							$("#editor-warning").show();
						}
					}
				});
				$("#add_editor").autocomplete({
					source: function( request, response ) {
						if (request.term.length < 3) {
							response(new Array());
						} else {
							$.get("http://www.capitalistparadise.com/api/autocomplete/nation/?start=" + request.term, function(nations) {
								response(nations);
							});
						}
					}
				});
				$("#add_editor_btn").on("click", function(event) {
					event.preventDefault();
					var nation = $("#add_editor").val();
					if (nation != "") {
						var name = nation.replaceAll(" ", "_").toLowerCase();
						if ($("#newspaper_editors").find("option[name='" + name + "']").length > 0) {
							$("#editor_duplicate").show();
							$("#editor_error").hide();
							return;
						}
						$("#editor_error").hide();
						$.get("http://www.capitalistparadise.com/api/nation/title/?name=" + name, function(json) {
							if (json[name] != null && $("#newspaper_editors").find("option[name='" + name + "']").length == 0) {
								var title = json[name]
								$("#newspaper_editors").append("<option value='" + $("#newspaper_editors").find("option").length + "' name='" + name + "'>" + title + "</option>");
								$("#editor_error").hide();
								$("#editor_duplicate").hide();
								$("#add_editor").val("");
								var added = (typeof $("#newspaper_editors").attr("add") != "undefined" ? $("#newspaper_editors").attr("add") : "");
								$("#newspaper_editors").attr("add", added + (added.length > 0 ? "," : "") + name);
							} else {
								$("#editor_duplicate").hide();
								$("#editor_error").show();
							}
						});
					} else {
						$("#editor_duplicate").hide();
						$("#editor_error").show();
					}
				});
				$("#submit_changes").on("click", function(event) {
					event.preventDefault();
					getNationStatesAuth(function(authCode) {
						var authToken = localStorage.getItem(getUserNation() + "-auth-token");
						var postData = "nation=" + getUserNation() + "&auth=" + authCode + (authToken != null ? "&auth-token=" + authToken : "");
						postData += "&title=" + encodeURIComponent($("#newspaper_name").val());
						postData += "&byline=" + encodeURIComponent($("#newspaper_byline").val());
						$.post("http://www.capitalistparadise.com/api/newspaper/administrate/?newspaper=" + $("#newspaper_name").attr("newspaper_id"), postData, function(data, textStatus, jqXHR) {
							var authToken = jqXHR.getResponseHeader("X-Auth-Token");
							if (authToken != null) {
								localStorage.setItem(getUserNation() + "-auth-token", authToken);
							}
							var postData = "";
							if (typeof $("#newspaper_editors").attr("remove") != "undefined") {
								postData += "&remove=" + $("#newspaper_editors").attr("remove");
							}
							if (typeof $("#newspaper_editors").attr("add") != "undefined") {
								postData += "&add=" + $("#newspaper_editors").attr("add");
							}
							if (postData.length > 0) {
								postData = "nation=" + getUserNation() + "&auth=" + authCode + (authToken != null ? "&auth-token=" + authToken : "") + postData;
								$.post("http://www.capitalistparadise.com/api/newspaper/editors/?newspaper=" + $("#newspaper_name").attr("newspaper_id"), postData, function(json) {
									window.location.href = "http://www.nationstates.net/page=blank/?lookup_newspaper=" + $("#newspaper_name").attr("newspaper_id");
								});
							} else {
								window.location.href = "http://www.nationstates.net/page=blank/?lookup_newspaper=" + $("#newspaper_name").attr("newspaper_id");
							}
						}).fail(function(data) {
							if (data.status == 401) {
								$("#lack_permissions_error").show();
							} else {
								$("#submission_error").show();
							}
							console.log(data);
						});
					});
				});
				$("#cancel_changes").on("click", function(event) {
					event.preventDefault();
					window.location.href = "http://www.nationstates.net/page=blank/?lookup_newspaper=" + $("#newspaper_name").attr("newspaper_id");
				});
				$("#inner-content").show();
			});
		});
	}

	function openArticleEditor(newspaper, article_id) {
		window.document.title = "NationStates | Article Editor"
		$("#content").html("<div id='news_header' style='text-align: center;'><h1>Newspaper Article Editor</h1><hr></div><div id='inner-content'></div>");
		$.get("http://capitalistparadise.com/nationstates/v2_0/newspaper_editor.html", function(html) {
			$("#inner-content").html(html);
				$("#submit_article").on("click", function(event) {
				event.preventDefault();
				getNationStatesAuth(function(authCode) {
					var authToken = localStorage.getItem(getUserNation() + "-auth-token");
					var postData = "nation=" + getUserNation() + "&auth=" + authCode + (authToken != null ? "&auth-token=" + authToken : "");
					postData += "&title=" + encodeURIComponent($("#article_title").val());
					postData += "&timestamp=" + ($("#minor_edit-0").prop("checked") ? $("#minor-edit-group").attr("timestamp") : Date.now());
					postData += "&author=" + encodeURIComponent($("#article_author").val());
					postData += "&column=" + $("#article_column").val();
					postData += "&order=" + $("#article_order").val();
					postData += "&article=" + encodeURIComponent($("#article_body").val());
					postData += "&visible=" + ($("#article_visible-1").prop("checked") ? "1" : "0");
					$.post("http://capitalistparadise.com/api/newspaper/submit/?newspaper=" + newspaper + "&articleId=" + article_id, postData, function(json) {
						window.location.href = "http://www.nationstates.net/page=blank/?lookup_newspaper=" + newspaper;
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
				$("#minor-edit-group").show();
				$("#minor_edit-0").prop("checked", true);
				$.get("http://capitalistparadise.com/api/newspaper/lookup/?id=" + newspaper + "&visible=false", function(json) {
					for (var i = 0; i < json.articles.length; i++) {
						var article = json.articles[i];
						if (article.article_id == article_id) {
							console.log(article);
							$("#minor-edit-group").attr("timestamp", article.timestamp);
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
		$("#content").html("<div id='news_header' style='text-align: center;'><h1 id='newspaper_name'></h1><div id='manage_newspaper'><p class='newspaper_controls'>Newspaper Controls</p><a class='button' style='font-weight: bold;' href='page=blank/?manage_newspaper=" + id + "'>Manage Newspaper</a><a class='button' style='font-weight: bold;' href='page=blank/?article_editor=" + id + "&article=-1'>Submit Article</a><a class='button' style='font-weight: bold;' href='page=blank/?view_articles=" + id + "'>View All Articles</a></div><i id='newspaper_byline'></i><hr></div><div id='inner-content'><div id='left_column'></div><div id='middle_column'></div><div id='right_column'></div></div><div id='bottom_content' style='text-align:center;'><i id='submissions' style='display:none;'>Looking to have your article or content featured? Contact <a id='submissions_editor' href='nation=afforess' class='nlink'>Afforess</a> for submissions!</i></div>");
		loadingAnimation();
		window.document.title = "NationStates | Newspaper"
		$(window).unbind("scroll");
		updateSize = function() {
			$("#inner-content").css("height", 0);
			$("#inner-content").children().each(function() {
				var height = $("#inner-content").height();
				$("#inner-content").css("height", Math.max(height, $(this).height() + 200) + "px");
				$("#left_column").find("img").css("max-width", ($("#left_column").width() - 30) + "px");
				$("#middle_column").find("img").css("max-width", ($("#middle_column").width() - 30) + "px");
				$("#right_column").find("img").css("max-width", ($("#right_column").width() - 30) + "px");
			});
		}
		$.get("http://capitalistparadise.com/api/newspaper/lookup/?id=" + id, function(json) {
			getNationStatesAuth(function(authCode) {	
				var authToken = localStorage.getItem(getUserNation() + "-auth-token");
				var postData = "nation=" + getUserNation() + "&auth=" + authCode + (authToken != null ? "&auth-token=" + authToken : "");
				$.post("http://capitalistparadise.com/api/newspaper/canedit/?newspaper=" + id, postData, function(data, textStatus, jqXHR) {
					var authToken = jqXHR.getResponseHeader("X-Auth-Token");
					if (authToken != null) {
						localStorage.setItem(getUserNation() + "-auth-token", authToken);
					}
					$(".edit_article").show();
					$("#manage_newspaper").show();
				});
			});
			window.document.title = json.newspaper;
			$("#newspaper_name").html("<a href='page=blank?lookup_newspaper=" + id + "'>" + parseBBCodes(json.newspaper) + "</a>");
			$("#newspaper_byline").html(parseBBCodes(json.byline));
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
						selector.append("<div newspaper='" + article.newspaper + "' id='article_id_" + article.article_id + "'></div>");
					}
				}
			}
			for (var i = 0; i < articles.length; i++) {
				var article = articles[i];
				var selector = $("#article_id_" + article.article_id);
				var html = "<h2 style='margin-top:-5px;margin-bottom:-15px'>" + parseBBCodes(article.title) + "</h2>";
				html += "<i><p>" + parseBBCodes(article.author) + ", " + (new Date(parseInt(article.timestamp, 10))).customFormat("#D##th# #MMMM# #YYYY#") + "</p></i>";
				html += "<div class='edit_article' style='display:none; margin-top:-12px;'><p><a class='button' href='page=blank/?article_editor=" + article.newspaper + "&article=" + article.article_id + "'>Edit Article</a></p></div>";
				html += parseBBCodes(article.article);
				selector.html(html);
				selector.find("img").load(function() {window.onresize();});
			}
			setTimeout(function() {window.onresize();}, 1000);
			window.onresize();
		});
		$("#submissions").show();
		window.onresize = updateSize;
	}

	function parseBBCodes(text) {
		text = $("<div></div>").html(text).text();
		text = text.replaceAll("[b]", "<b>").replaceAll("[/b]", "</b>");
		text = text.replaceAll("[i]", "<i>").replaceAll("[/i]", "</i>");
		text = text.replaceAll("[normal]", "<span style='font-size:14px'>").replaceAll("[/normal]", "</span>");
		text = text.replaceAll("[u]", "<u>").replaceAll("[/u]", "</u>");
		text = text.replaceAll("[blockquote]", "<blockquote class='news_quote'>").replaceAll("[/blockquote]", "</blockquote>");
		text = text.replaceAll("[list]", "<ul>").replaceAll("[/list]", "</ul>");
		text = text.replaceAll("[*]", "</li><li>");
		text = parseUrls(text);
		text = parseImages(text);
		text = updateTextLinks("nation", text);
		text = updateTextLinks("region", text);
		text = text.replaceAll("\n", "</br>");
		return text;
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
			var innerText = text.substring(index + 5, endIndex + 1);
			var url = innerText.substring(0, innerText.indexOf("]"));
			
			text = text.substring(0, index) + "<a target='_blank' href='" + url + "'>" + innerText.substring(innerText.indexOf("]") + 1, innerText.length - 1) + "</a>" + text.substring(endIndex + 6);
			index = text.indexOf("[url=", index);
		}
		return text;
	}

	function parseImages(text) {
		var index = text.indexOf("[img]");
		while (index > -1) {
			var endIndex = text.indexOf("[/img]", index + 6);
			if (endIndex == -1) {
				break;
			}
			var url = text.substring(index + 5, endIndex);
			console.log(url);
			
			text = text.substring(0, index) + "<img class='center-img' src='" + url + "'>" + text.substring(endIndex + 6);
			index = text.indexOf("[img]", index);
		}
		return text;
	}
})();