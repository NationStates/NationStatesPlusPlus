(function(){
	if ($("#ns_setting").length == 0) {
		var banner = $("#banner, #nsbanner");
		if (isRiftTheme()) {
			$("<div class='bel' id='ns_setting'><a href='//www.nationstates.net/page=blank?ns_settings=true' class='bellink'><i class='fa fa-wrench'></i>NS++ Settings</a></div>").insertAfter($(".belspacer.belspacermain .belspacer"));
		} else {
			$(banner).append("<div id='ns_setting'><a href='//www.nationstates.net/page=blank?ns_settings=true' class='banner-theme' style='right: 138px;'>NS++ Settings</a></div>");
		}
		if (window.location.href.indexOf('forum.nationstates.net/') == -1 ) {
			if (isRiftTheme()) {
				$("<div class='bel' id='puppet_setting' style='display:none;'><a href='/page=blank?puppet_manager' class='bellink'><i class='fa fa-group'></i>Puppets</a></div>").insertAfter($(".belspacer.belspacermain .belspacer"));
			} else {
				$(banner).append("<div id='puppet_setting' style='display:none;'><a href='/page=blank?puppet_manager' class='banner-theme' style='right: 248px;'>Puppets</a></div>");
			}
		}
	}
	$("#puppet_setting").on("mouseover", function() { if ($("#puppet_setting_form:visible").length == 0) showPuppets(); });
	(new UserSettings()).child("show_puppet_switcher").on(function(data) {
		localStorage.setItem(getUserNation() + "_show_puppet_switcher", data["show_puppet_switcher"]);
		if (data["show_puppet_switcher"]) {
			$("#puppet_setting").show();
		} else {
			$("#puppet_setting").hide();
		}
	}, true);
	(new UserSettings()).child("autologin-puppets").on(function(data) {
		$("#puppet_setting").data("autologin-puppets", data["autologin-puppets"] ? true : false);
	}, false);
	(new UserSettings()).child("redirect-puppet-page").on(function(data) {
		$("#puppet_setting").data("redirect-puppet-page", data["redirect-puppet-page"] ? true : false);
	}, true);
	var switcher = localStorage.getItem(getUserNation() + "_show_puppet_switcher");
	if (switcher == null || switcher) {
		$("#puppet_setting").show();
	}
	
	if (getVisiblePage() == "blank" && window.location.href.contains("?puppet_manager")) {
		window.document.title = "Puppet Manager";
		$("#content").html("<h1>Puppet Management</h1>");
		$("#content").append("<div class='row' style='width: 100%;'> </div>");
		$(".row").append("<div class='col-md-6' style='box-sizing: border-box;'><table class='table table-hover' id='active_puppets'><tr><th>Puppet Nations</th></tr></table></div>");
		$(".row").append("<div class='col-md-6' style='box-sizing: border-box;'><table class='table table-hover' id='puppet_lists'><tr><th>Puppet Lists</th></tr></table></div>");
		$("#content").append("<div id='buttons' class='row' style='width: 100%;'></div>");
		$("#buttons").append("<div id='left-buttons' class='col-md-6' style='box-sizing: border-box;'></div>");
		$("#buttons").append("<div id='right-buttons' class='col-md-6' style='box-sizing: border-box;'></div>");
		
		$("#right-buttons").append("<button class='btn' id='rename_list' disabled>Rename List</button>");
		$("#rename_list").on("click", function(event) {
			event.preventDefault();
			$("#add_list_input").val($("#puppet_lists .puppet_active_row").data("name"));
			$("#add_list_input").css("width", "calc(100% - 92px)");
			$("#add_list").html("Rename");
		});
		
		var puppetAction = function(actionCallback, titleText) {
			$("body").append("<div id='active_action' class='disable_page'></div>");
			$("body").append("<div id='active_action_infobox' class='centered_infobox'><h1 style='text-align:center;'>" + titleText + "</h1><div id='current_login'><p>Active Puppet:</p><p>ETA: </p></div><div id='login_progress'><div id='login_progress_bar'></div></div><button class='btn btn-danger' id='cancel_infobox'>Cancel</button></div>");
			
			var loginIds = [];
			$("#cancel_infobox").on("click", function(event) {
				event.preventDefault();
				for (var i = 0; i < loginIds.length; i += 1) {
					clearTimeout(loginIds[i]);
				}
				finishAction(0);
			});

			var finishAction = function(count) {
				setTimeout(function(name, pass) {
					$.post("//www.nationstates.net/?nspp=1", "logging_in=1&nation=" + encodeURIComponent(name) + "&password=" + encodeURIComponent(pass) + "&autologin=yes", function(data) { });
					$("#active_action").remove();
					$("#active_action_infobox").remove();
					window.onbeforeunload = null;
				}, (6000 * count) - 4500, getUserNation(), getPuppetManager().findPassword(getUserNation()));
			};

			var login = function(name, len, count) {
				var manager = getPuppetManager();
				var pass = manager.getActivePuppetList()[name];
				actionCallback(name, pass);
				$("#current_login").html("<p>Active Puppet: " + name.replaceAll("_", " ").toTitleCase() + "</p><p>ETA: " + ((len - count) * 6000) / 1000 + "s</p>");
				$("#login_progress_bar").width(375 * (count / len));
			};

			var count = 0;
			$("#active_puppets tr.puppet_active_row").each(function() {
				var name = $(this).data("name");
				loginIds.push(setTimeout(login, 6000 * count, name, $("#active_puppets tr.puppet_active_row").length, count));
				count += 1;
			});
			loginIds.push(finishAction(count));
			
			window.onbeforeunload = function() { return "Puppet actions are currently processing..."; }
		};

		$("#left-buttons").append("<button style='margin-right: 5px;' class='btn' id='login_puppets' disabled>Login</button>");
		$("#left-buttons").append("<button style='margin-right: 5px;' class='btn' id='dismiss_issues' disabled>Dismiss Issues</button>");
		$("#left-buttons").append("<button style='margin-right: 5px;' class='btn' id='select_all_puppets'>Select All</button>");
		$("#dismiss_issues").on("click", function(event) {
			event.preventDefault();
			puppetAction(function(name, pass) {
				$.post("//www.nationstates.net/?nspp=1", "logging_in=1&nation=" + encodeURIComponent(name) + "&password=" + encodeURIComponent(pass) + "&autologin=no", function(data) { 
					$.post("//www.nationstates.net/page=dilemmas?nspp=1", "dismiss_all=1", function() { });
				});
			}, "Puppet Auto-Dismiss");
		});

		$("#login_puppets").on("click", function(event) {
			event.preventDefault();
			puppetAction(function(name, pass) {
				$.post("//www.nationstates.net/?nspp=1", "logging_in=1&nation=" + encodeURIComponent(name) + "&password=" + encodeURIComponent(pass) + "&autologin=no", function(data) { 
				});
			}, "Puppet Auto-Login");
		});

		$("#select_all_puppets").on("click", function(event) {
			event.preventDefault();
			$("#active_puppets tr.puppet_row").addClass("puppet_active_row");
			updateLeftButtions();
		});

		var updatePuppetLists = function() {
			var manager = getPuppetManager();
			var html = "<tr><th>Puppet Lists</th></tr>";
			for (var i = 0; i < manager._data.list.length; i += 1) {
				var list = manager._data.list[i];
				html += "<tr class='puppet_row " + (list.name == manager.getActiveList() ? "puppet_active_row" : "") + "' data-name='" + list.name + "'><td>";
				html += list.name.toTitleCase();
				if (list.name == manager.getActiveList()) {
					html += " <b> (Active)</b>";
					if (list.name != "default") {
						$("#rename_list").removeAttr("disabled");
					} else {
						$("#rename_list").attr("disabled", "true");
					}
				}
				if (list.name != "default")
					html += "<span data-name='" + list.name + "' class='puppet_remove'></span>";
				html += "</td></tr>";
			}
			$("#puppet_lists").html(html + "<tr><td><input id='add_list_input' type='text' class='input-text' placeholder='Add New List' style='width: calc(100% - 82px);'></input><button class='btn' id='add_list' style='margin-top: -10px; margin-left: -4px;'>Add</button></td></tr>");
			var addList = function() {
				if ($("#add_list_input").val() != "") {
					var manager = getPuppetManager();
					if ($("#add_list").html() == "Rename") {
						manager.renamePuppetList($("#puppet_lists .puppet_active_row").data("name"), $("#add_list_input").val());
						if (manager.getActiveList() == $("#puppet_lists .puppet_active_row").data("name")) {
							manager.setActiveList($("#add_list_input").val());
						}
						updatePuppetLists();
					} else {
						if (manager.addPuppetList($("#add_list_input").val())) {
							updatePuppetLists();
						}
					}
					$("#add_list_input").focus();
				}
			};
			$("#add_list").on("click", addList);
			$("#add_list_input").on("keydown", function(event) { if (event.keyCode == 13) addList(); });
			$("#puppet_lists .puppet_row").on("click", function(event) {
				var manager = getPuppetManager();
				if ($(this).data("name") != manager.getActiveList()) {
					manager.setActiveList($(this).data("name"));
					updatePuppetLists();
					updatePuppetTable();
				}
			});
			$("#puppet_lists .puppet_remove").on("click", function(event) {
				var manager = getPuppetManager();
				manager.removePuppetList($(this).data("name"));
				event.stopPropagation();
				$(this).parents("tr").children('td, th')
					.animate({ padding: 0 }).wrapInner('<div/>')
					.children().slideUp(function() { $(this).closest('tr').remove(); });
			});
		};
		updatePuppetLists();
		
		var puppetTableRow = function(name) {
			html = "<tr class='puppet_row' data-name='" + name + "'><td><span name='" + name + "'></span>";
			html += name.replaceAll("_", " ").toTitleCase();
			html += "<div class='wa_status puppet-wa' style='display:none'></div>";
			html += "</td><td><span region='" + name + "' ></span>";
			html += "</td><td><span data-name='" + name + "' class='puppet_remove'></span>"
			html += "</td></tr>";
			return html;
		};

		var updateLeftButtions = function() {
			//Toggle buttons enabled/disabled if there are any rows selected
			if ($("#active_puppets tr.puppet_active_row").length > 0) {
				$("#left-buttons button").removeAttr("disabled");
			} else {
				$("#left-buttons button").attr("disabled", true);
			}
			//Select is always accessable
			$("#select_all_puppets").removeAttr("disabled");
		}
		
		var updatePuppetTable = function() {
			var manager = getPuppetManager();
			var puppets = manager.getActivePuppetList();
			var html = "<tr><th>Puppet Nations</th><th>Region</th><th></th></tr>";
			var nations = [];
			for (var name in puppets) {
				if (Object.prototype.hasOwnProperty.call(puppets, name)) {
					html += puppetTableRow(name);
					nations.push(name);
				}
			}

			sendWebsocketEvent("nation_status", { "nations": nations });

			$(window).one("websocket.nation_status", function(event) {
				for (var name in event.json) {
					if (Object.prototype.hasOwnProperty.call(event.json, name)) {
						var flag = "//www.nationstates.net/images/flags/exnation.png";
						var title = name.replaceAll("_", " ").toTitleCase();
						if (event.json[name] != null) {
							if (event.json[name].flag != "0" && event.json[name].alive) flag = event.json[name].flag;
							title = event.json[name].title;
							if (event.json[name].waMember) {
								$("span[name='" + name + "']").parents("td").find(".puppet-wa").show();
							}
							if (event.json[name].region && event.json[name].alive) {
								$("span[region='" + name + "']").html("<span style='width: 24px; display: inline-block;'><img class='miniflag' style='margin-bottom:4px' src='" + event.json[name].region.flag + "'></span> " + event.json[name].region.title);
							}
						}
						$("span[name='" + name + "']").css("width", "32px").css("display", "inline-block").html($("<img/>",{ 
							class: 'miniflag',
							title: title,
							css: {
								"max-height": "18px",
								"max-width": "28px",
							},
							src: flag,
						}));
					}
				}
			});

			$("#active_puppets").html(html + "<tr><td><input id='add_puppet_name' type='text' class='input-text' placeholder='Nation' style='width: 100%;'></input></td><td><input id='add_puppet_pass' type='text' class='input-text' placeholder='Password' style='width: 100%;'></input></td><td><button class='btn' id='add_puppet' style='margin-top: -1px;'>Add</button></td></tr>");
			var addPuppet = function() {
				if ($("#add_puppet_name").val() != "" && $("#add_puppet_pass").val() != "") {
					var manager = getPuppetManager();
					manager.addPuppet($("#add_puppet_name").val(), $("#add_puppet_pass").val());
					updatePuppetTable();
					$("#add_puppet_name").focus();
				}
			};
			$("#active_puppets .puppet_remove").on("click", function(event) {
				var manager = getPuppetManager();
				manager.removePuppet($(this).data("name"));
				$(this).parents("tr").children('td, th')
					.animate({ padding: 0 }).wrapInner('<div/>')
					.children().slideUp(function() { $(this).closest('tr').remove(); });
				event.stopPropagation();
			});
			$("#add_puppet").on("click", addPuppet);
			$("#add_puppet_name").on("keydown", function(event) { if (event.keyCode == 13) addPuppet(); });
			$("#add_puppet_pass").on("keydown", function(event) { if (event.keyCode == 13) addPuppet(); });
			
			//Track shift/control key states
			var shiftDown = false;
			var ctrlDown = false;
			$(window).keydown(function(event) {
				if (event.which == 16) shiftDown = true;
				if (event.which == 17) ctrlDown = true;
			}).keyup(function(event) {
				if (event.which == 16) shiftDown = false;
				if (event.which == 17) ctrlDown = false;
			});
			
			var lastSelectedRow = null;
			$("#active_puppets tr.puppet_row").on("click", function() {
				//Shift multiselect
				if (shiftDown && lastSelectedRow) {
					var selected = $(this);
					var select = false;
					$("#active_puppets tr.puppet_row").each(function() {
						if (this == selected[0] || this == lastSelectedRow[0]) {
							select = !select;
						}
						if (select) {
							$(this).addClass("puppet_active_row");
						}
					});
				}
				//Regular single select
				if (!shiftDown && !ctrlDown) {
					$("#active_puppets tr.puppet_row").removeClass("puppet_active_row");
				}
				//Control add/remove single select
				if (ctrlDown && $(this).hasClass("puppet_active_row")) {
					$(this).removeClass("puppet_active_row");
				} else {
					$(this).addClass("puppet_active_row");
				}
				
				//Toggle buttons enabled/disabled if there are any rows selected
				updateLeftButtions();
				
				//Store the last selected row
				if ($(this).hasClass("puppet_active_row")) {
					lastSelectedRow = $(this);
				}
			});
			
			updateLeftButtions();
		};
		updatePuppetTable();
	}
})();

