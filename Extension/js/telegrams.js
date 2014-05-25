(function() {
	if ((getVisiblePage() == "telegrams" || getVisiblePage() == "tg") && !isAntiquityTheme()) {
		if (getSettings().isEnabled("clickable_telegram_links")) {
			linkifyTelegrams();
		}
		addTelegramSearch();
		addFormattingButtons();
		addForwardButton();
	}

	function linkifyTelegrams() {
		$(".tgcontent").children("p").each(function() {
			if ($(this).attr('class') != "replyline") {
				$(this).html(linkify($(this).html()));
			}
		});
	}
	
	function addForwardButton() {
		$("<button name='forward' title='Forward Telegram' style='font-weight:bold;' class='button icon arrowright'>Forward Telegram</button>").insertBefore(".tgreplybutton");
		$('body').on('click', "button[name='forward']", function(event) {
			event.preventDefault();
			var tgid = $(this).parents(".tg").attr("id").split("-")[1];			
			var fowardDiv = $(this).parents(".tg").find("div[name='forward']");
			if (fowardDiv.length == 0) {
				fowardDiv = $("<div name='forward' style='display:none;'><input type='text' size='28' value='' placeholder='Forward To' class='text-input forward-input'><button disabled='disabled' name='forward-tg' style='height:30px; font-weight:bold;' class='button icon approve primary' tgid='" + tgid + "'>Forward</button><div class='forward-to-recips' style='display: block;'></div></div>").insertAfter($(this).parents(".tgcontent"));
			}
			if (fowardDiv.is(":visible")) {
				fowardDiv.hide("slow");
			} else {
				fowardDiv.show("slow");
			}
		});

		$('body').on('click', "button[name='forward-tg']", function(event) {
			event.preventDefault();
			var tgid = $(this).attr("tgid");
			var tgto = $(this).parents(".tg").find("input.forward-input").val();
			var fwto = $(this).parents(".tg").find("div[name='forward']");
			$.get("//www.nationstates.net/page=tg/tgid=" + tgid + "/raw=1/template-overall=none?nspp=1", function(html) {
				var tg = $(html).find(".tgcontent pre").text();				
				var recipients = $(html).find(".tg_headers").text().replaceAll("→", "&#8594;");
				var chk = $("#tgcompose form input[name='chk']").val();
				$.post("//www.nationstates.net/page=telegrams?nspp=1", "chk=" + chk + "&tgto=" + tgto + "&message=" + encodeURIComponent("[i][b]Telegram Forwarded By:[/b] [nation=short]" + getUserNation() + "[/nation]\n[b]Telegram Recipients:[/b] " + recipients + "\n [/i]-------------------------------------------\n\n" + tg) + "&send=1", function(html) {
					if ($(html).find("p.error").length > 0) {
						window.alert($(html).find("p.error").text());
					} else {
						fwto.hide("slow");
						fwto.find("input").val("");
						fwto.find("button").attr("disabled", "disabled");
						fwto.find("div.forward-to-recips").html("");
					}
				});
			});
		});

		$('body').on('change', "input.forward-input", function(event) {
			var recips = $(this).parents(".tg").find("div.forward-to-recips");
			var forward = $(this).parents(".tg").find("button[name='forward-tg']");
			recips.hide('fast').html('<p><img src="/images/loading1.gif"></div>').show('slow');
			$.get('/page=ajax3/a=addrecip/toline=' + $(this).val() + "?nspp=1", function(data) {
				recips.html(data);
				$("<br>").insertBefore(recips.find(".tginfo:first"));
				recips.show('slow');
				if (recips.find("span").length > 0 && recips.find(".tgerror").length == 0) {
					forward.removeAttr("disabled");
				} else {
					forward.attr("disabled", "disabled");
				}
			});
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
			$.get("/page=telegrams/folder=" + getTelegramFolder() + "?start=" + (page * 20 - 20) + "&nspp=1", function(contents) {
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