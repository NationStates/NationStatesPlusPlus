(function() {
	if ((getVisiblePage() == "telegrams" || getVisiblePage() == "tg") && !isAntiquityTheme()) {
		if (isSettingEnabled("clickable_telegram_links")) {
			linkifyTelegrams();
		}
		addTelegramSearch();
		addReplyToAll();
	}

	function linkifyTelegrams() {
		$(".tgcontent").children("p").each(function() {
			if ($(this).attr('class') != "replyline") {
				$(this).html(linkify($(this).html()));
			}
		});
	}

	function addReplyToAll() {
		$(".tg").each(function() {
			if ($(this).find(".tg_headers").find("a.nlink").length > 2 && $(this).find(".tgreplybutton").length > 0) {
				var replyLine = $(this).find(".replyline");
				var replyTo = replyLine.find(".tgreplybutton").attr("href").split("=");
				replyTo = replyTo[replyTo.length - 1];
				//console.log("Reply to all for: " + replyTo);
				
				//$(this).find(".replyline").find(".tgreplybutton").
				$(this).find(".replyline").prepend("<button id='reply_to_all_" + replyTo + "' class='tgreplybutton button icon chat'>Reply to All</button>");
				$("#reply_to_all_" + replyTo).click(function() {
					var tgid = $(this).attr("id").split("_")[$(this).attr("id").split("_").length - 1];
					var existingReplyBox = $('#tgreply-' + tgid);
					if (existingReplyBox.length) {
						if (!existingReplyBox.is(':hidden') && existingReplyBox.find('textarea').val() && !confirm("Your reply hasn't been sent. Are you sure you want to close the reply box?")) {
							existingReplyBox.find('.sendtgbutton').effect("pulsate", { times: 3 }, 1200);
							return;
						}
						var sendButton = existingReplyBox.find("button[name=send]");
						if (existingReplyBox.is(':hidden')) {
							sendButton.html("Send to All");
						} else {
							sendButton.html(sendButton.attr("alt"));
						}
						existingReplyBox.slideToggle(400);
					} else {
						var tgsender = $('#tgsender-' + tgid).val();
						var new_reply = $('<div id="tgreply-' + tgid + '"/>').insertAfter($(this).parents('.tgcontent'));
						var html = $('.tgreplytemplate').html().replace(/%NATION NAME%/g, tgsender).replace('%TGID%', tgid);
						$(new_reply).hide().html(html).slideDown('fast');
						$('#tgreply-' + tgid + ' fieldset.preview').attr('id', 'tgpreview-' + tgid);
						var sendButton = new_reply.find("button[name=send]");
						sendButton.attr("alt", sendButton.html());
						sendButton.attr("tgid", tgid);
						sendButton.html("Send to All");
						sendButton.click(function(event) {
							//console.log("Send: " + sendButton.html());
							if (sendButton.html() == "Send to All") {
								event.preventDefault();
								//console.log("Clicked send to all");
								var nations = "";
								var telegram = sendButton.parents(".tg");
								telegram.find(".tg_headers").find(".nlink").each(function() {
									var nation = $(this).attr("href").substring(7);
									if (nation != getUserNation()) {
										//console.log("Sending reply to : " + nation);
										if (nations.length > 0) nations += "%2C+";
										nations += nation;
									}
								});
								//console.log("tgto: " + nations);
								//console.log("chk: " + telegram.find("input[name=chk]").val());
								//console.log("tgid: " + sendButton.attr("tgid"));
								var message = $('#tgreply-' + tgid).find('textarea').serialize();
								//console.log(message);
								$.post("page=telegrams", "chk=" + telegram.find("input[name=chk]").val() + "&tgto=" + nations + "&in_reply_to=" + sendButton.attr("tgid") + "&" + message + "&send=1", function(html) {
									var info = $(html).find(".info").html();
									var error = false;
									if (typeof info == 'undefined') {
										info = "Error sending telegram!";
										error = true;
									}
									if ($(".info").length == 0) {
										$("<p class='info'>" + info + "</p>").insertAfter("h1:first");
									} else {
										$(".info").html(info);
									}
									if (error) {
										$(".info").css("background-color", "rgb(255, 194, 194)");
										$(".info").css("border", "solid 2px red");
									} else {
										$('#tgreply-' + sendButton.attr("tgid")).slideToggle(1000);
										$('#tgreply-' + sendButton.attr("tgid")).val("");
									}
									$(".info").hide().slideDown('slow');
								});
							}
						});
					}
					$("#tgreply-" + tgid).animate({toggle: 'height'}, 'fast');
				});
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

		$("<input id='tgsearch' placeholder='Search' type='text' style='max-width:500px; min-width:150px; width:" + $(document.body).width() / 6 + "px;margin-right: 20px;height: 24px;font-size: 18px;'>").insertBefore("#composebutton");
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

