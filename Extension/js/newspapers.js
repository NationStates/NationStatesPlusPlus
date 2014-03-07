var newspaperEditorHTML = '<form class=form-horizontal><fieldset><div class=control-group><label class=control-label for=article_title>Article Title</label><div class=controls><input id=article_title name=article_title placeholder="Article Title" type=text class=input-xlarge style="width: 85%" required><p class=help-block>Title of the Article</p></div></div><div class=control-group><label class=control-label for=article_author>Article Author</label><div class=controls><input id=article_author name=article_author type=text  placeholder="Article Author" class=input-xlarge style="width: 85%" required><p class=help-block>Author(s) of the Article</p></div></div><div class=control-group id=article_column_order style=display:none><label class=control-label for=article_column>Article Column</label><div class=controls><select id=article_column name=article_column class=input-xlarge><option value=0>Left Column<option value=1>Center Column<option value=2>Right Column</select></div></div><div class=control-group id=article_placement_order style=display:none><label class=control-label for=article_order>Article Order</label><div class=controls><select id=article_order name=article_order class=input-xlarge><option value=0>First<option value=1>Second<option value=2>Third<option value=3>Fourth<option value=4>Fifth</select></div></div><div class=control-group><label class=control-label for=article_body>Article Body</label><div class=controls><textarea id=article_body name=article_body style="width: 85%; height: 450px" required>Your article goes here!</textarea><p class=nscodedesc>Formatting tags: <abbr title="Bold text: e.g. I [b]love[/b] this region!">[b]</abbr> <abbr title="Underline text: e.g. I [u]really[/u] love this region!">[u]</abbr> <abbr title="Italicize text: e.g. I [i]cannot express how much[/i] I love this region!">[i]</abbr> <abbr title="Make nation link: e.g. Endorse your delegate, [nation]Black Widow[/nation]!">[nation]</abbr> <abbr title="Make region link: e.g. Visit my region, [region]The Pacific[/region]!">[region]</abbr> <abbr title="Insert a url: e.g. [url=http://google.com]Google[/url]">[url]</abbr> <abbr title="Insert an image: e.g. [img]http://www.nationstates.net/images/banner3green.png[/url]">[img]</abbr> <abbr title="Insert a list: e.g. [list][*]A list item! [*]Another list item! [/list]">[list]</abbr> <abbr title="Insert a blockquote: e.g. [blockquote]A really long quote[/blockquote]">[blockquote]</abbr></p><p id=writing_tips class=hide>Writing Tips:<ul class=hide><li style="margin-bottom: 6px">Keep articles brief and to the point. 10000-word manifestos make poor newspaper articles.</li><li style="margin-bottom: 6px">Use images. Images focus the reader"s attention and give something other than a wall-of-text to look at.</li><li style="margin-bottom: 6px">If you are using names, places, or terms the average reader will not understand, be sure to spend a sentence or two explaining it.</li><li style="margin-bottom: 6px">Spell and grammar check. The preview button exists for a reason.</li><li style="margin-bottom: 6px">Keep articles fun. No one wants to read a spreadsheet.</li></ul></p></div></div><div class=control-group id=minor-edit-group style=display:none><label class=control-label for=minor_edit>Minor Edit</label><div class=controls><label class=checkbox for=minor_edit-0 title="Minor edits will not update article timestamps nor nag readers about an update"><input type=checkbox name=minor_edit id=minor_edit-0 value="This is a minor edit" title="Minor edits will not update article timestamps nor nag readers about an update">This is a minor edit</label></div></div><div class=control-group id=visibility_controls><label class=control-label for=article_visible>Ariticle Published:</label><div class=controls><label class=radio for=article_visible-0><input type=radio name=article_visible id=article_visible-0 value=Draft checked>Draft <i>(Article will NOT be visible)</i></label><label class=radio for=article_visible-1><input type=radio name=article_visible id=article_visible-1 value=Published>Published <i>(Article WILL be visible)</i></label><label class=radio for=article_visible-2><input type=radio name=article_visible id=article_visible-2 value=Retired>Retired <i>(Article will be ARCHIVED)</i></label></div></div><div class=control-group><div class=controls><div class="hide preview newspaper_preview"><legend class=newspaper_legend>Preview</legend><div class=preview_content id=previewcontent></div></div></div></div><div class=control-group><div class=controls><button id=preview_article name=preview_article class=btn>Preview Article</button></div></div><div class=control-group><div class=controls><button id=submit_article name=submit_article class="btn btn-success">Submit Article</button> <button id=cancel_article name=cancel_article class="btn btn-danger">Cancel Changes</button> <button id=delete_article name=delete_article class="btn btn-danger">Permanently Delete</button></div></div></fieldset></form>';
var newspaperAdminHTML = '<form class="form-horizontal"><fieldset><div class="control-group"><label class="control-label" for="newspaper_name">Newspaper Name</label><div class="controls"><input id="newspaper_name" name="newspaper_name" type="text" placeholder="New York Times" style="width: 85%" class="input-xlarge" required><p class="help-block">Name of the Newspaper</p></div></div><div class="control-group"><label class="control-label" for="newspaper_byline">Byline</label><div class="controls"><input id="newspaper_byline" name="newspaper_byline" type="text" placeholder="Fair, Free, Fun Press a courtesy of Megacorp Inc." style="width: 85%" class="input-xlarge"><p class="help-block">Newspaper Byline</p></div></div><div class="control-group"><label class="control-label" for="newspaper_editor">Editor-in-chief</label><div class="controls"><input id="newspaper_editor" name="newspaper_editor" type="text" placeholder="El Presidente" style="width: 450px" title="Contact Afforess to change Editor-In-Chief" class="input-xlarge"><p class="help-block">Newspaper Official Editor</p></div></div><div class="control-group"><label class="control-label" for="newspaper_columns">Column Layout</label><div class="controls"><select id="newspaper_columns" name="newspaper_columns" class="input-xlarge" style="width: 460px"><option value="1">Single Column Layout</option><option value="2">Double Column Layout</option><option value="3">Triple Column Layout</option></select></div></div><div class="control-group"><label class="control-label" for="newspaper_region">Affiliated Region</label><div class="controls"><input id="newspaper_region" name="newspaper_region" type="text" placeholder="" style="width: 450px" title="Contact Afforess to change Affiliate Region" class="input-xlarge"></div></div><div class="control-group"><label class="control-label" for="newspaper_editors">Editors</label><div class="controls"><select id="newspaper_editors" name="newspaper_editors" class="input-xlarge" style="width: 460px; height: 260px" multiple><option>Option one</option><option>Option two</option></select><span id="editor-warning" style="display:none; color: red">You can not remove the Editor-In-Chief!</span></div></div><div class="control-group"><div class="controls"><button id="remove_selected_editors" name="remove_selected_editors" class="btn btn-danger">Remove Selected Editors</button></div></div><div class="control-group"><label class="control-label" for="add_editor">Add Editors</label><div class="controls"><div class="input-append"><input id="add_editor" name="add_editor" class="input-xlarge" placeholder="Really Cool Nation" style="width: 450px" type="text"><div class="btn-group"><button id="add_editor_btn" class="btn" style="height: 32px">Add Editor</button></div></div><span id="editor_error" style="display:none; color: red">Not a valid nation</span> <span id="editor_duplicate" style="display:none; color: red">Nation is already an editor!</span></div></div><div class="control-group"><div class="controls"><button id="submit_changes" name="submit_changes" class="btn btn-success">Save</button> <button id="cancel_changes" name="cancel_changes" class="btn btn-danger">Cancel</button> <span id="submission_error" style="display:none; color: red">Unable to Save Changes!</span> <span id="lack_permissions_error" style="display:none; color: red">You don\'t have permission to make changes!</span></div></div></fieldset></form>';
(function() {
	if (window.location.href.indexOf("template-overall=none") != -1) {
		return;
	}
	var menu = $(".menu");
	$("<li id='regional_newspaper' style='display:none;'><a id='rnews' style='display: inline;' href='//www.nationstates.net/page=blank/?regional_news=" + getUserRegion() + "'>REGIONAL NEWS</a></li>").insertAfter($("#wa_props").length > 0 ? $("#wa_props") : menu.find("a[href='page=un']").parent());
	$("<li id='gameplay_newspaper'><a id='gnews' style='display: inline;' href='//www.nationstates.net/page=blank/?gameplay_news'>GAMEPLAY NEWS</a></li>").insertAfter($("#regional_newspaper"));
	$("<li id='roleplay_newspaper'><a id='rpnews' style='display: inline;' href='//www.nationstates.net/page=blank/?roleplay_news'>ROLEPLAY NEWS</a></li>").insertAfter($("#gameplay_newspaper"));
	var settings = getSettings();
	if (!settings.isEnabled("show_gameplay_news")) {
		$("#gameplay_newspaper").hide();
	}
	if (!settings.isEnabled("show_roleplay_news")) {
		$("#roleplay_newspaper").hide();
	}
	if (getUserRegion() != "") {
		$.get("https://nationstatesplusplus.net/api/newspaper/region/?region=" + getUserRegion(), function(json) {
			if (getSettings().isEnabled("show_regional_news")) {
				$("#regional_newspaper").show();
			}
			$("#regional_newspaper").attr("news-id", json.newspaper_id);
		});
	}

	if (window.location.href.indexOf("regional_news") != -1) {
		$.get("https://nationstatesplusplus.net/api/newspaper/region/?region=" + $.QueryString["regional_news"], function(json) {
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
		$.get("https://nationstatesplusplus.net/api/newspaper/lookup/?id=" + newspaper + "&visible=2&lookupArticleId=" + articleId, function(json) {
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
		$.get("https://nationstatesplusplus.net/api/newspaper/lookup/?id=" + newspaper + "&visible=2&hideBody=true", function(json) {
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
			$.get("https://nationstatesplusplus.net/api/newspaper/latest/?id=" + id, function(json) {
				var lastRead = getSettings().getValue("newspapers", {})[id];
				var menu = $("#" + selector);
				if (lastRead == null || json.timestamp > parseInt(lastRead)) {
					if (menu.find("span[name='nag']").length == 0) {
						menu.append("<span name='nag'> (*)</span>");
					}
				} else {
					menu.find("span[name='nag']").remove();
				}
			});
			//This just prevents GP and RP news editors from seeing pending articles...sick of their sloppy approvals
			//Newspapers id 0 and 1 are GP and RP news. Id > 1 means all custom regional newspapers
			if (getUserNation() == "shadow_afforess" || id > 1) {
				$.get("https://nationstatesplusplus.net/api/newspaper/editor/?newspaper=" + id + "&nation=" + getUserNation(), function(data) {
					$.get("https://nationstatesplusplus.net/api/newspaper/lookup/?id=" + id + "&hideBody=true&visible=3", function(json) {
						var menu = $("#" + selector);
						if (json.articles.length > 0) {
							if (menu.find("span[name='pending-nag']").length == 0) {
								menu.append("<span style='color:red;' name='pending-nag'> (" + json.articles.length + ")</span>");
							}
						} else {
							menu.find("span[name='pending-nag']").remove();
						}
					});
				});
			}
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
	if (getUserNation() != "") {
		updateNewspaperNags();
		$(window).on("page/update", updateNewspaperNags);
	}
	
	var visibleTypes = ["Draft", "Published", "Archived", "User Submitted, Pending Review"];
	function viewNewspaperArticles(newspaper) {
		window.document.title = "NationStates | Newspaper"
		$("#content").html("<div id='news_header' style='text-align: center;'><h1>Newspaper Article Database</h1><hr></div><div id='inner-content'></div>");
		$.get("https://nationstatesplusplus.net/api/newspaper/editor/?newspaper=" + newspaper + "&nation=" + getUserNation(), function(data, textStatus, jqXHR) {
			$.get("https://nationstatesplusplus.net/api/newspaper/lookup/?id=" + newspaper + (window.location.href.contains("pending=1") ? "&visible=3" : "&visible=-1") + "&hideBody=true", function(json) {
				var articles = json.articles;
				var html = "";
				for (var i = 0; i < articles.length; i++) {
					var article = articles[i];
					html += "<div class='article_summary'><div style='position:absolute; right: 20px;'><a class='btn edit_article' href='page=blank/?article_editor=" + article.newspaper + "&article=" + article.article_id + "'>Edit Article</a></div><b>Article: </b>" + parseBBCodes(article.title) + "<br/><b>Author: </b>" + parseBBCodes(article.author) + "</br><b>Last Edited: </b>" + (new Date(parseInt(article.timestamp, 10))).customFormat("#D##th# #MMMM# #YYYY#") + "</br><b>Status: </b>" + visibleTypes[article.visible] + "</div>"
				}
				$("#inner-content").html(html);
			});
		}).fail(function() {
			$("#inner-content").html("<span style='color:red'>You do not have permission to view the article database for this newspaper!</span>");
		});
	}

	function openNewspaperAdministration(newspaper) {
		window.document.title = "NationStates | Newspaper"
		$("#content").html("<div id='news_header' style='text-align: center;'><h1>Newspaper Administration</h1><hr></div><div id='inner-content'></div>");
		$("#inner-content").html(newspaperAdminHTML);
		if (isDarkTheme()) $("select").css("color", "white");
		$.get("https://nationstatesplusplus.net/api/newspaper/details/?id=" + newspaper, function(data) {
			$("#newspaper_name").val(data.newspaper);
			$("#newspaper_name").attr("newspaper_id", newspaper);
			$("#newspaper_byline").val(data.byline);
			$("#newspaper_editor").val(data.editor.replaceAll("_", " ").toTitleCase());
			$("#newspaper_editor").attr("name", data.editor);
			$("#newspaper_editor").toggleDisabled();
			$("#newspaper_region").val(data.region != "null" ? data.region : "");
			$("#newspaper_region").toggleDisabled();
			$("#newspaper_columns").val(data.columns);
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
			if (navigator.userAgent.toLowerCase().indexOf('firefox') == -1) {
				$("#add_editor").autocomplete({
					source: function( request, response ) {
						$.get("https://nationstatesplusplus.net/api/autocomplete/nation/?start=" + request.term, function(nations) {
							response(nations);
						});
					},
					minLength: 3,
					delay: 50
				});
			}
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
					$.get("https://nationstatesplusplus.net/api/nation/title/?name=" + name, function(json) {
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
				postData += "&columns=" + $("#newspaper_columns").val();
				
				doAuthorizedPostRequest("https://nationstatesplusplus.net/api/newspaper/administrate/?newspaper=" + $("#newspaper_name").attr("newspaper_id"), postData, function(data, textStatus, jqXHR) {
					var postData = "";
					if (typeof $("#newspaper_editors").attr("remove") != "undefined") {
						postData += "&remove=" + $("#newspaper_editors").attr("remove");
					}
					if (typeof $("#newspaper_editors").attr("add") != "undefined") {
						postData += "&add=" + $("#newspaper_editors").attr("add");
					}
					if (postData.length > 0) {
						doAuthorizedPostRequest("https://nationstatesplusplus.net/api/newspaper/editors/?newspaper=" + $("#newspaper_name").attr("newspaper_id"), "editors=1" + postData, function(json) {
							window.location.href = "//www.nationstates.net/page=blank/?lookup_newspaper=" + $("#newspaper_name").attr("newspaper_id");
						});
					} else {
						window.location.href = "//www.nationstates.net/page=blank/?lookup_newspaper=" + $("#newspaper_name").attr("newspaper_id");
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
				window.location.href = "//www.nationstates.net/page=blank/?lookup_newspaper=" + $("#newspaper_name").attr("newspaper_id");
			});
			$("#inner-content").show();
		});
	}

	function openArticleEditor(newspaper, article_id) {
		window.document.title = "NationStates | Article Editor"
		$("#content").html("<div id='news_header' style='text-align: center;'><h1>Newspaper Article Editor</h1><hr></div><div id='inner-content'></div>");
		console.log(newspaperEditorHTML);
		console.log("newspaper editor");
		$("#inner-content").html(newspaperEditorHTML);
		var submitArticle = function(deleteArticle) {
			var postData = "title=" + encodeURIComponent($("#article_title").val());
			postData += "&timestamp=" + ($("#minor_edit-0").prop("checked") ? $("#minor-edit-group").attr("timestamp") : Date.now());
			postData += "&author=" + encodeURIComponent($("#article_author").val());
			postData += "&article=" + encodeURIComponent($("#article_body").val());
			if (window.location.href.contains("volunteer=1")) {
				postData += "&visible=3";
			} else if (deleteArticle) {
				postData += "&visible=4";
			} else {
				postData += "&visible=" + ($("#article_visible-2").prop("checked") ? "2" : ($("#article_visible-1").prop("checked") ? "1" : "0"));
			}
			doAuthorizedPostRequest("https://nationstatesplusplus.net/api/newspaper/submit/?newspaper=" + newspaper + "&articleId=" + article_id, postData, function(json) {
				window.location.href = "//www.nationstates.net/page=blank/?lookup_newspaper=" + newspaper;
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
			window.location.href = "//www.nationstates.net/page=blank/?gameplay_news";
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
			$.get("https://nationstatesplusplus.net/api/newspaper/lookup/?id=" + newspaper + "&visible=-1&lookupArticleId=" + article_id, function(json) {
				for (var i = 0; i < json.articles.length; i++) {
					var article = json.articles[i];
					if (article.article_id == article_id) {
						$("#minor-edit-group").attr("timestamp", article.timestamp);
						$("#article_title").val(article.title);
						$("#article_author").val(article.author);
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
	}

	function openNationStatesNews(id) {
		var settings = getSettings();
		settings.getValue("newspapers", {})[id] = Date.now();
		settings.pushUpdate();
		$("#ns_news_nag").remove();
		$("#content").html("<div id='news_header' style='text-align: center;'><h1 id='newspaper_name'></h1><div id='manage_newspaper'><p class='newspaper_controls'>Newspaper Controls</p><a class='button' style='font-weight: bold;' href='page=blank/?manage_newspaper=" + id + "'>Manage Newspaper</a><a class='button' style='font-weight: bold;' href='page=blank/?article_editor=" + id + "&article=-1'>Submit Article</a><a class='button pending_articles' style='font-weight: bold; display:none; background:red;' href='page=blank/?view_articles=" + id + "&pending=1'>View Pending Articles</a><a class='button' style='font-weight: bold;' href='page=blank/?view_articles=" + id + "'>View All Articles</a></div><div id='view_newspaper'><p class='newspaper_controls'>Newspaper Database</p><a class='button' style='font-weight: bold;' href='page=blank/?archived_articles=" + id + "'>View Archived Articles</a><a class='button' style='font-weight: bold;' href='page=blank/?article_editor=" + id + "&article=-1&volunteer=1'>Submit Article</a></div><i id='newspaper_byline'></i><hr></div><div id='inner-content'><iframe id='article-content' seamless='seamless' frameborder='no' scrolling='no' src='https://nationstatesplusplus.net/newspaper?id=" + id + "&embed=true" + (isDarkTheme() ? "&dark=true" : "") + "' style='width: 100%;height: 1000px;'></iframe></div>");
		loadingAnimation();
		window.document.title = "NationStates | Newspaper"
		$.get("https://nationstatesplusplus.net/api/newspaper/lookup/?id=" + id, function(json) {
			$.get("https://nationstatesplusplus.net/api/newspaper/editor/?newspaper=" + id + "&nation=" + getUserNation(), function(data, textStatus, jqXHR) {
				$(".edit_article").show();
				$("#manage_newspaper").show();
				//This just prevents GP and RP news editors from approving articles...sick of their sloppy approvals
				if (getUserNation() == "shadow_afforess" || id > 1) {
					$.get("https://nationstatesplusplus.net/api/newspaper/lookup/?id=" + id + "&hideBody=true&visible=3", function(json) {
						if (json.articles.length > 0) {
							$("a.pending_articles").html("Pending Articles (" + json.articles.length + ")").show();
						}
					});
				}
			}).fail(function() {
				$("#view_newspaper").show();
			});
			window.document.title = json.newspaper;
			$("#newspaper_name").html("<a href='https://nationstatesplusplus.net/newspaper?id=" + id + "'>" + parseBBCodes(json.newspaper) + "</a>");
			$("#newspaper_byline").html(parseBBCodes(json.byline));
		});
		window.addEventListener('message', receiveMessage, false);
		function receiveMessage(event) {
			if (event.data.height) {
				$("#article-content").height(event.data.height + 50);
			}
		}
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