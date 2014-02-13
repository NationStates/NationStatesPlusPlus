(function() {
	if ((getVisiblePage() == "telegrams" || getVisiblePage() == "tg") && !isAntiquityTheme()) {
		if (getSettings().isEnabled("clickable_telegram_links")) {
			linkifyTelegrams();
		}
		addTelegramSearch();
		addFormattingButtons();
	}

	function linkifyTelegrams() {
		$(".tgcontent").children("p").each(function() {
			if ($(this).attr('class') != "replyline") {
				$(this).html(linkify($(this).html()));
			}
		});
	}

	function addTelegramSearch() {
		$("<button id='returninbox' title='Return To Inbox' class='button big strong' style='font-weight: bold;'>Return To Folder</button>").insertBefore("#composebutton");
		$("#returninbox").click(function(event) {
			cancelSearch = true;
			$("#cancelsearch").hide();
			$("#tglist").show();
			$("#tgsearchresults").hide();
			$(".paginate1").show();
			$("#returninbox").hide();
		});
		$("#returninbox").hide();

		$("<button id='cancelsearch' title='Cancel Search' class='button big strong' style='margin-right: 10px; margin-left:10px; font-weight: bold;'>Searching Page 1...</button>").insertBefore("#composebutton");
		$("#cancelsearch").click(function(event) {
			cancelSearch = !cancelSearch;
			if (cancelSearch) {
				$("#cancelsearch").html("Resume Searching");
				NProgress.done();
			} else {
				NProgress.start();
				$("#cancelsearch").html("Searching Page " + page + "...");
				searchNextPage(searchToKeywords($("#tgsearch").val().toLowerCase()));
			}
		});
		$("#cancelsearch").hide();

		$("<input id='tgsearch' class='text-input-lg' placeholder='Search' type='text' style='max-width:500px; min-width:150px; width:" + $(document.body).width() / 6 + "px;margin-right: 20px;'>").insertBefore("#composebutton");
		window.onresize = function() {
			$("#tgsearch").css("width",  $(document.body).width() / 6 + "px");
		}
		$('#tgsearch').keydown(function(event) {
			if (event.which == 13) {
				event.preventDefault();
				searchTelegrams();
			}
		});
	}

	var cancelSearch = false;
	var page = 1;
	var resultFound = false;
	function searchTelegrams() {
		cancelSearch = false;
		var keywords = searchToKeywords($("#tgsearch").val().toLowerCase());
		$("#tglist").hide();
		$("#returninbox").show();
		$("#cancelsearch").show();
		$("#cancelsearch").attr('disabled', false);
		if ($("#tgsearchresults").length == 0) {
			$("<div id='tgsearchresults'></div>").insertBefore("#tglist");
		}
		$("#tgsearchresults").show();
		$("#tgsearchresults").html("");
		$(".paginate1").hide();
		page = 1;
		if (isNumber(getTelegramStart())) {
			page = Math.floor(parseInt(getTelegramStart()) / 20) + 1;
		}
		console.log("Page: " + page);
		searchTelegramContents(keywords, $(document.body));
		
		$("p").each(function() {
			if ($(this).html().startsWith("Viewing telegrams")) {
				var numTelegrams = $(this).html().substring($(this).html().lastIndexOf(" "), $(this).html().length - 2);
				NProgress.configure({trickleRate: (1 / (numTelegrams / 20 + 1)), trickleSpeed: 425});
				console.log("Num telegrams: " + numTelegrams);
				return true;
			}
		});

		NProgress.start();
		searchNextPage(keywords);
	}

	function searchNextPage(keywords) {
		if (!cancelSearch) {
			$.get("/page=telegrams/folder=" + getTelegramFolder() + "?start=" + (page * 20 - 20), function(contents) {
				if ($(contents).find("#tglist").find(".emptytglist").length == 0) {
					searchTelegramContents(keywords, contents);
					page += 1;
					setTimeout(searchNextPage(keywords), 6000);
				} else {
					$("#cancelsearch").show();
					$("#cancelsearch").html("Search Complete!");
					$("#cancelsearch").attr('disabled', true);
					if (!resultFound) {
						$("#tgsearchresults").html("<div class='rmbolder'>No Search Results</div>");
					}
					NProgress.done();
				}
			});
		}
	}

	function searchTelegramContents(keywords, contents) {
		if (!cancelSearch) {
			$("#cancelsearch").html("Searching Page " + page + "...");
		}
		$(contents).find(".tg").each(function() {
			var telegram = "";
			$(this).find(".tgcontent").find("p").each(function() {
				if ($(this).attr("class") != "replyline" && !$(this).text().contains("In reply to")) {
					telegram += $(this).text().toLowerCase() + " ";
				}
			});
			
			for (var i = 0; i < keywords.length; i++) {
				if (telegram.toLowerCase().contains(keywords[i]) || $(this).find(".tg_headers").html().contains(keywords[i])) {
					resultFound = true;
					var result = $("#tgsearchresults").find("#" + $(this).attr("id"));
					if (result.length == 0) {
						result = $("#tgsearchresults").append("<div id='" + $(this).attr("id") + "' class='tg'>" + $(this).html() + "</div>");
						result.find(".ui-accordion-header .tgsample").css("display", "none");
						result.find(".tgcontent").parent().css("display", "block");
					}
					result.highlight(keywords[i]);
				}
			}
		});
	}
})();