(function() {
	if (window.location.href.indexOf("template-overall=none") != -1) {
		return;
	}
	var menu = $(".menu");
	$("<li id='regional_newspaper' style='display:none;'><a id='rnews' style='display: inline;' href='http://www.nationstates.net/page=blank/?regional_news=" + getUserRegion() + "'>REGIONAL NEWS</a></li>").insertAfter($("#wa_props").length > 0 ? $("#wa_props") : menu.find("a[href='page=un']").parent());
	$("<li id='gameplay_newspaper'><a id='gnews' style='display: inline;' href='http://www.nationstates.net/page=blank/?gameplay_news'>GAMEPLAY NEWS</a></li>").insertAfter($("#regional_newspaper"));
	$("<li id='roleplay_newspaper'><a id='rpnews' style='display: inline;' href='http://www.nationstates.net/page=blank/?roleplay_news'>ROLEPLAY NEWS</a></li>").insertAfter($("#gameplay_newspaper"));
	var settings = getSettings();
	if (!settings.isEnabled("show_gameplay_news")) {
		$("#gameplay_newspaper").hide();
	}
	if (!settings.isEnabled("show_roleplay_news")) {
		$("#roleplay_newspaper").hide();
	}
	if (getUserRegion() != "") {
		$.get("http://nationstatesplusplus.net/api/newspaper/region/?region=" + getUserRegion(), function(json) {
			if (getSettings().isEnabled("show_regional_news")) {
				$("#regional_newspaper").show();
			}
			$("#regional_newspaper").attr("news-id", json.newspaper_id);
		});
	}

	if (window.location.href.indexOf("regional_news") != -1) {
		$.get("http://nationstatesplusplus.net/api/newspaper/region/?region=" + $.QueryString["regional_news"], function(json) {
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
	} else if (window.location.href.indexOf("archived_articles") != -1) {
		viewNewspaperArchive($.QueryString["archived_articles"]);
	} else if (window.location.href.indexOf("view_article") != -1) {
		viewNewspaperArticle($.QueryString["view_article"], $.QueryString["article"]);
	}

	function viewNewspaperArticle(newspaper, articleId) {
		window.document.title = "NationStates | Newspaper"
		$("#content").html("<div id='news_header' style='text-align: center;'><h1 id='newspaper_name'></h1><div id='manage_newspaper'></div><i id='newspaper_byline'></i><hr></div><div id='inner-content'></div>");
		$.get("http://nationstatesplusplus.net/api/newspaper/lookup/?id=" + newspaper + "&visible=2&lookupArticleId=" + articleId, function(json) {
			var articles = json.articles;
			var html = "";
			$("#newspaper_name").html("<a href='page=blank?lookup_newspaper=" + newspaper + "'>" + parseBBCodes(json.newspaper) + "</a>");
			$("#newspaper_byline").html(parseBBCodes(json.byline));
			for (var i = 0; i < json.articles.length; i++) {
				var article = json.articles[i];
				if (article.article_id == articleId) {
					var article = articles[i];
					html += "<div class='full_article'>"
					html += "<i><p>" + parseBBCodes(article.author) + ", " + (new Date(parseInt(article.timestamp, 10))).customFormat("#D##th# #MMMM# #YYYY#") + "</p></i>";
					html += parseBBCodes(article.article);
					html += "</div>"
				}
			}
			$("#inner-content").html(html);
			$("#inner-content").find("img").load(function() {window.onresize();});
		});
	}

	function viewNewspaperArchive(newspaper) {
		window.document.title = "NationStates | Newspaper"
		$("#content").html("<div id='news_header' style='text-align: center;'><h1>Newspaper Article Archive</h1><hr></div><div id='inner-content'></div>");
		$.get("http://nationstatesplusplus.net/api/newspaper/lookup/?id=" + newspaper + "&visible=2&hideBody=true", function(json) {
			var articles = json.articles;
			var html = "";
			for (var i = 0; i < articles.length; i++) {
				var article = articles[i];
				html += "<div class='article_summary'><div style='position:absolute; right: 20px;'><a class='btn edit_article' href='page=blank/?view_article=" + article.newspaper + "&article=" + article.article_id + "'>Read Full Article</a></div><b>Article: </b>" + parseBBCodes(article.title) + "<br/><b>Author: </b>" + parseBBCodes(article.author) + "</br><b>Posted: </b>" + (new Date(parseInt(article.timestamp, 10))).customFormat("#D##th# #MMMM# #YYYY#") + "</div>"
			}
			$("#inner-content").html(html);
		});
	}

	
	function updateNewspaperNags() {
		var checkUpdates = function(id, selector) {
			$.get("http://nationstatesplusplus.net/api/newspaper/latest/?id=" + id, function(json) {
				var lastRead = getSettings().getValue("newspapers", {})[id];
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
		if (getSettings().isEnabled("show_gameplay_news")) {
			checkUpdates(0, "gnews");
		}
		if (getSettings().isEnabled("show_roleplay_news")) {
			checkUpdates(1, "rpnews");
		}
		if (getSettings().isEnabled("show_regional_news")) {
			if ($("#regional_newspaper").attr("news-id") != null) {
				checkUpdates($("#regional_newspaper").attr("news-id"), "rnews");
			}
		}
	}
	$(window).on("page/update", updateNewspaperNags);
	
	var visibleTypes = ["Draft", "Published", "Archived", "User Submitted, Pending Review"];
	
	function viewNewspaperArticles(newspaper) {
		window.document.title = "NationStates | Newspaper"
		$("#content").html("<div id='news_header' style='text-align: center;'><h1>Newspaper Article Database</h1><hr></div><div id='inner-content'></div>");
		doAuthorizedPostRequest("http://nationstatesplusplus.net/api/newspaper/canedit/?newspaper=" + newspaper, "", function(data, textStatus, jqXHR) {
			$.get("http://nationstatesplusplus.net/api/newspaper/lookup/?id=" + newspaper + (window.location.href.contains("pending=1") ? "&visible=3" : "&visible=-1") + "&hideBody=true", function(json) {
				var articles = json.articles;
				var html = "";
				for (var i = 0; i < articles.length; i++) {
					var article = articles[i];
					html += "<div class='article_summary'><div style='position:absolute; right: 20px;'><a class='btn edit_article' href='page=blank/?article_editor=" + article.newspaper + "&article=" + article.article_id + "'>Edit Article</a></div><b>Article: </b>" + parseBBCodes(article.title) + "<br/><b>Author: </b>" + parseBBCodes(article.author) + "</br><b>Last Edited: </b>" + (new Date(parseInt(article.timestamp, 10))).customFormat("#D##th# #MMMM# #YYYY#") + "</br><b>Status: </b>" + visibleTypes[article.visible] + "</div>"
				}
				$("#inner-content").html(html);
			});
		}, function() {
			$("#inner-content").html("<span style='color:red'>You do not have permission to view the article database for this newspaper!</span>");
		});
	}

	function openNewspaperAdministration(newspaper) {
		window.document.title = "NationStates | Newspaper"
		$("#content").html("<div id='news_header' style='text-align: center;'><h1>Newspaper Administration</h1><hr></div><div id='inner-content'></div>");
		console.log("fetching newspaper contents...");
		$.get("http://nationstatesplusplus.net/nationstates/v2_1/newspaper_administration.html", function(html) {
			console.log("fetched newspaper contents:" + html);
			$("#inner-content").hide();
			$("#inner-content").html(html);
			$.get("http://nationstatesplusplus.net/api/newspaper/details/?id=" + newspaper, function(data) {
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
					var postData = "title=" + encodeURIComponent($("#newspaper_name").val());
					postData += "&byline=" + encodeURIComponent($("#newspaper_byline").val());
					
					doAuthorizedPostRequest("http://www.capitalistparadise.com/api/newspaper/administrate/?newspaper=" + $("#newspaper_name").attr("newspaper_id"), postData, function(data, textStatus, jqXHR) {
						var postData = "";
						if (typeof $("#newspaper_editors").attr("remove") != "undefined") {
							postData += "&remove=" + $("#newspaper_editors").attr("remove");
						}
						if (typeof $("#newspaper_editors").attr("add") != "undefined") {
							postData += "&add=" + $("#newspaper_editors").attr("add");
						}
						if (postData.length > 0) {
							doAuthorizedPostRequest("http://www.capitalistparadise.com/api/newspaper/editors/?newspaper=" + $("#newspaper_name").attr("newspaper_id"), "editors=1" + postData, function(json) {
								window.location.href = "http://www.nationstates.net/page=blank/?lookup_newspaper=" + $("#newspaper_name").attr("newspaper_id");
							});
						} else {
							window.location.href = "http://www.nationstates.net/page=blank/?lookup_newspaper=" + $("#newspaper_name").attr("newspaper_id");
						}
					}, function(data) {
						if (data.status == 401) {
							$("#lack_permissions_error").show();
						} else {
							$("#submission_error").show();
						}
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
		$.get("http://nationstatesplusplus.net/nationstates/v2_1/newspaper_editor.html", function(html) {
			$("#inner-content").html(html);
			var submitArticle = function(deleteArticle) {
				var postData = "title=" + encodeURIComponent($("#article_title").val());
				postData += "&timestamp=" + ($("#minor_edit-0").prop("checked") ? $("#minor-edit-group").attr("timestamp") : Date.now());
				postData += "&author=" + encodeURIComponent($("#article_author").val());
				postData += "&column=" + $("#article_column").val();
				postData += "&order=" + $("#article_order").val();
				postData += "&article=" + encodeURIComponent($("#article_body").val());
				if (window.location.href.contains("volunteer=1")) {
					postData += "&visible=3";
				} else if (deleteArticle) {
					postData += "&visible=4";
				} else {
					postData += "&visible=" + ($("#article_visible-2").prop("checked") ? "2" : ($("#article_visible-1").prop("checked") ? "1" : "0"));
				}
				doAuthorizedPostRequest("http://nationstatesplusplus.net/api/newspaper/submit/?newspaper=" + newspaper + "&articleId=" + article_id, postData, function(json) {
					window.location.href = "http://www.nationstates.net/page=blank/?lookup_newspaper=" + newspaper;
				}, function(data, textStatus, jqXHR) {
					$(".error, .info").remove();
					$("<p class='error'>" + (data.status == 401 ? "You do not have permission" : "Error Submitting Article") + "</p>").insertAfter($("#news_header"));
					if (window.location.href.contains("volunteer=1")) {
						$("p.error").html($("p.error").html() + "</br>You can only have one queued submission for each newspaper at a time. Wait for the article to be approved first.");
					}
					$(".error").hide().animate({height: "toggle"}, 600);
					$("#submit_article").attr("disabled", false);
				});
			};
			$("#submit_article").on("click", function(event) {
				event.preventDefault();
				$("#submit_article").attr("disabled", true);
				submitArticle(false);
			});
			$("#cancel_article").on("click", function(event) {
				event.preventDefault();
				window.location.href = "http://www.nationstates.net/page=blank/?gameplay_news";
			});
			$("#delete_article").on("click", function(event) {
				event.preventDefault();
				if ($("#delete_article").html() != "Are You Sure?") {
					$("#delete_article").html("Are You Sure?");
					setTimeout(function() { $("#delete_article").html("Permanently Delete"); }, 15000);
					return;
				}
				submitArticle(true);
			});
			$("#preview_article").on("click", function(event) {
				event.preventDefault();
				$("#previewcontent").html(parseBBCodes($("#article_body").val()));
				$(".preview").show();
			});
			if (article_id > -1) {
				$("#minor-edit-group").show();
				$("#minor_edit-0").prop("checked", true);
				$.get("http://nationstatesplusplus.net/api/newspaper/lookup/?id=" + newspaper + "&visible=-1&lookupArticleId=" + article_id, function(json) {
					for (var i = 0; i < json.articles.length; i++) {
						var article = json.articles[i];
						if (article.article_id == article_id) {
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
			if (window.location.href.contains("volunteer=1")) {
				$("#visibility_controls").hide();
				$("#article_column_order").hide();
				$("#article_placement_order").hide();
				$("#delete_article").hide();
				$("#writing_tips, ul.hide").show();
			}
		});
	}

	function openNationStatesNews(id) {
		var settings = getSettings();
		settings.getValue("newspapers", {})[id] = Date.now();
		settings.pushUpdate();
		$("#ns_news_nag").remove();
		$("#content").html("<div id='news_header' style='text-align: center;'><h1 id='newspaper_name'></h1><div id='manage_newspaper'><p class='newspaper_controls'>Newspaper Controls</p><a class='button' style='font-weight: bold;' href='page=blank/?manage_newspaper=" + id + "'>Manage Newspaper</a><a class='button' style='font-weight: bold;' href='page=blank/?article_editor=" + id + "&article=-1'>Submit Article</a><a class='button pending_articles' style='font-weight: bold; display:none; background:red;' href='page=blank/?view_articles=" + id + "&pending=1'>View Pending Articles</a><a class='button' style='font-weight: bold;' href='page=blank/?view_articles=" + id + "'>View All Articles</a></div><div id='view_newspaper'><p class='newspaper_controls'>Newspaper Database</p><a class='button' style='font-weight: bold;' href='page=blank/?archived_articles=" + id + "'>View Archived Articles</a><a class='button' style='font-weight: bold;' href='page=blank/?article_editor=" + id + "&article=-1&volunteer=1'>Submit Article</a></div><i id='newspaper_byline'></i><hr></div><div id='inner-content'><div id='left_column'></div><div id='middle_column'></div><div id='right_column'></div></div><div id='bottom_content' style='text-align:center;'><i id='submissions' style='display:none;'>Looking to have your article or content featured? Contact <a id='submissions_editor' href='nation=afforess' class='nlink'>Afforess</a> for submissions!</i></div>");
		loadingAnimation();
		window.document.title = "NationStates | Newspaper"
		//$(window).unbind("scroll");
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
		$.get("http://nationstatesplusplus.net/api/newspaper/lookup/?id=" + id, function(json) {
			doAuthorizedPostRequest("http://nationstatesplusplus.net/api/newspaper/canedit/?newspaper=" + id, "", function(data, textStatus, jqXHR) {
				$(".edit_article").show();
				$("#manage_newspaper").show();
				$.get("http://nationstatesplusplus.net/api/newspaper/lookup/?id=" + id + "&hideBody=true&visible=3", function(json) {
					if (json.articles.length > 0) {
						$("a.pending_articles").html("Pending Articles (" + json.articles.length + ")").show();
					}
				});
			}, function() {
				$("#view_newspaper").show();
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
})();