(function($){
	if (getVisiblePage() == "activity") {
		console.log("Starting");
		happenings = function(max) {
			var timeoutHandle, numAutoRefreshes, numEmptyRefreshes, latestEID, lastUrl, amWaiting, State;
			var refreshDelay = 330;
			function buildHappeningsUrl() {
				var url = '/page=ajax2/a=reports';
				if (typeof State != 'undefined') {
					url += '/view=' + State.data.view;
					if (State.data.filters) {
						url += '/filter=' + State.data.filters.join('+');
					}
				}
				return url;
			}

			$.fn.newHappenings = function(delay, state) {
				clearTimeout(timeoutHandle);
				numAutoRefreshes = numEmptyRefreshes = latestEID = 0;
				State = state;
				lastUrl = buildHappeningsUrl();
				if (amWaiting) {
					delay += 100;
				} else {
					amWaiting = true;
					if ($('#reports li').length) {
						$('#reports').hide('slow', function() {
						showSpinner();
						});
					} else {
						showSpinner();
					}
				}
				timeoutHandle = setTimeout(fetchHappenings, delay);
			}
			$.fn.cancelRefreshHappenings = function() {
				clearTimeout(timeoutHandle);
			}

			function showSpinner() {
				$('#reports').hide().html('<div class="spinner2"><img src="/images/loading1.gif"> Collating...').show(400, function() {
					$('#reports .spinner2').animate( { "left": "20%" }, 2000, 'swing', function() {
						$('#reports .spinner2').animate( { "left": "0" }, 2000);
					});
				});
			}

			function fetchHappenings() {
				clearTimeout(timeoutHandle);
				var myRefreshDelay = 333;
				var url = buildHappeningsUrl();
				var myUrl = url;
				if (max) {
				   if (!numAutoRefreshes) {
				   myUrl += '/limit=' + max;
				   } else {
				   myUrl += '/limit=' + (max * 3);
				   }
				}
				if (latestEID) {
					myUrl += '/sinceid=' + latestEID;
				}
				$.get(myUrl, function(data) {
					amWaiting = false;
					if (url != lastUrl) {
						return;	// user selections changed since we requested this data
					}
					data = data.replace(/\n/g, '');
					if ($('#reports li').length == 0) {
						// Initial data
						var initialData;
						if (!data) {
							initialData = '<p style="margin-top:0">No results.';
							myRefreshDelay = 60000;
						} else {
							initialData = '<ul>' + data + '</ul>';
							if ($(data).length == 100) {
								initialData += '<p class="smalltext"><a href="#" class="button morereports">More...</a> </p>';
							}
						}
						$('#reports').hide(0, function() {
							$(this).html(initialData).show('fast');
						});
					} else {
						// Top-up data
						if (!data) {
							numEmptyRefreshes++;
							myRefreshDelay *= numEmptyRefreshes;
						} else {
							numEmptyRefreshes = 0;
							var delay = myRefreshDelay / ($(data).length); 
							$($(data).prependTo("#reports ul").hide().get().reverse()).each(function(i) {
								$(this).delay(delay*i).animate({
								"height": "show",
								"marginTop": "show",
								"marginBottom": "show",
								"paddingTop": "show",
								"paddingBottom": "show"}, 333);
							});

							if (max) {
								var n = $('#reports li').length;
								if (n > max) {
									delay = myRefreshDelay / (n - max);
									$($('#reports li').slice(max - n).get().reverse()).each(function(i) {
										$(this).delay(delay*i).hide(333, function() { 
											$(this).remove(); 
										});
									});
								}
							}
						}
					}
					$(data).each(function() {
						var myEID = $(this).attr('id');
						if (myEID) {
						myEID = myEID.split('happening-')[1];
							if (myEID && +myEID > +latestEID) {
								latestEID = myEID;
							}
						}
					});
					numAutoRefreshes++;
					timeoutHandle = setTimeout(fetchHappenings, myRefreshDelay);
				});
				updateTimes();
			}

			function updateTimes() {
				var now = Math.floor(Date.now() / 1000);
				$('#reports time').each(function() {
				var t = $(this).attr('data-epoch');
				var secondsAgo = now - t;
				var newTime;
				if (secondsAgo < 60) {
					newTime = "Seconds";
				} else if (secondsAgo < 7200) {
					newTime = Math.floor(secondsAgo / 60) + " minutes";
				} else if (secondsAgo < 345600 && secondsAgo % 86400 >= 3600) {
					newTime = Math.floor(secondsAgo % 86400 / 3600) + " hours";
				} else if (secondsAgo < 31536000) {
					newTime = "";
				} else {
					return;
				}
				if(newTime.substring(0,2) == '1 ') {
					newTime = newTime.substring(0, newTime.length - 1);
				}
				if (secondsAgo >= 86400) {
					newTime = Math.floor(secondsAgo / 86400) + " day" + (secondsAgo < 172800 ? "" : "s") + (newTime.length ? " " + newTime : "");
				}
				newTime += " ago";
				if ($(this).html() != newTime) {
					$(this).fadeOut('slow', function() { $(this).html(newTime).fadeIn('slow') });
				}
				});
			}
		};

		reports = function() {
			var History = window.History;
			var State = History.getState();

			if (!State.data.view) {
				var re = State.url.match(/view=([a-z\.0-9_\-]+)/i);
				if (re) {
				State.data.view = re[1];
				} else {
				State.data.view = 'world';
				}
			}
			if (!State.data.filters) {
				var re = State.url.match(/filter=([a-z\+ ]+)/);
				if (re) {
				State.data.filters = re[1].split('+');
				}
			}
			checkChosenLinks();
			refreshReports();

			History.Adapter.bind(window, 'statechange', function() {
				State = History.getState(); // refresh
				checkChosenLinks();
				refreshReports();
			});

			function refreshReports(extraDelay) {
				var delay = 333;
				if (extraDelay) {
					delay += extraDelay;
				}
				$(this).newHappenings(delay, State);
			}

			function recordState() {
				var data = { };
				data.view = $('.rselector.chosenlink').attr('href').substring(1);
				data.filters = $('.panelselector a.chosenlink').map(function() { return $(this).attr('href').substring(1); }).toArray();
				if (!data.filters.length) {
					data.filters = [ 'all' ];
				}
				var url = '/page=activity/view=' + data.view + '/filter=' + data.filters.join('+');
				History.pushState( data , "NationStates | Activity | " + data.view.toUpperCase() + ": " + data.filters.join(' + '), url);
				return data;
			}

			function checkChosenLinks() {
				// Bring links into sync with requested filters & views. Necessary because the
				// page may be loaded from a bookmark or BACK/FORWARD History via browser button.
				$('a.rselector').removeClass('chosenlink');
				$('a.rselector[href="#' + State.data.view + '"]').addClass('chosenlink');

				if ($('a.rselector.chosenlink').length == 0) {
					State.data.view = 'world';
					$('a.rselector[href=#world]').addClass('chosenlink');
				}

				var want_all;
				if (!State.data.filters)
					want_all = 1;
				else
					want_all = (State.data.filters.indexOf('all') != -1);
				$('.paneloptionssub a').removeClass('chosenlink');
				if (want_all) {
					$('#paneloptionsall').addClass('chosenlink');
				} else {
					$('#paneloptionsall').removeClass('chosenlink');
					$.grep(State.data.filters, function(n, i) {
						$('.paneloptionssub a[href=#' + n + ']').addClass('chosenlink');
					});
				}
			}

			$('a.rselector').off('click').click(function(event) {
				event.preventDefault();
				var prev_view = State.data.view;
				var prev_filter = State.data.filter;
				$('a.rselector').removeClass('chosenlink');
				$(this).toggleClass('chosenlink');
				recordState();
				if (State.data.view == prev_view && State.data.filter == prev_filter) {
				// Nothing changed: player wants to reload results
					refreshReports();
				}
			});

			$('.paneloptions a').off('click').click(function(event) {
				event.preventDefault();
				$(this).toggleClass('chosenlink');
				if ($(this).attr('href') == '#all') {
				if ($(this).hasClass('chosenlink')) {
					// Selected ALL: turn off everything else
					$('.paneloptionssub a').removeClass('chosenlink');
				}
				} else {
					if ($('.paneloptionssub a.chosenlink').length) {
						// At least 1 sub link is chosen
						$('#paneloptionsall').removeClass('chosenlink');
					} else {
						$('#paneloptionsall').addClass('chosenlink');
					}
				}
				recordState();
			});
			$('.panelcat a').off('click').click(function(event) {
				event.preventDefault();
				var mylinks = $(this).parent().parent().find('td.paneloptions a');
				if (mylinks.hasClass('chosenlink')) {
					mylinks.removeClass('chosenlink');
				} else {
					mylinks.addClass('chosenlink');
					$('#paneloptionsall').removeClass('chosenlink');
				}
				recordState();
			});
			$('body').off('click').on('click', 'a.morereports', function(event) {
				event.preventDefault();
				var oldestEID = $('#reports').find('li').last().attr('id');
				if (oldestEID) {
				oldestEID = oldestEID.split('happening-')[1];
				var url = '/page=ajax2/a=reports';
				if (State.data.view) {
					url += '/view=' + State.data.view;
				}
				if (State.data.filters) {
					url += '/filter=' + State.data.filters.join('+');
				}
				url += '/beforeid=' + oldestEID;
				$('#reports a.morereports').hide('fast');
				$.get(url, function(data) {
					if (data) {
					$(data).hide().delay(333).appendTo('#reports ul').show('fast', function() {
						if ($(data).length == 100) {
							$('#reports a.morereports').show('fast');
						}
					});
					}
				});
				}
			});
		};

		$(document.body).append("<div id='progress_state' progress='0' style='display:none;'></div>");
		$(document).keypress(function(event) {
			var progress = parseInt($("#progress_state").attr("progress"));
			console.log(progress);
			console.log(event.keyCode);
			if (progress < 2 && event.keyCode == 119) { $("#progress_state").attr("progress", progress + 1); return; }
			if (progress >= 2 && progress < 4 && event.keyCode == 115) { $("#progress_state").attr("progress", progress + 1); return; }
			if (progress == 4 && event.keyCode == 97) { $("#progress_state").attr("progress", progress + 1); return; }
			if (progress == 5 && event.keyCode == 100) { $("#progress_state").attr("progress", progress + 1); return; }
			if (progress == 6 && event.keyCode == 97) { $("#progress_state").attr("progress", progress + 1); return; }
			if (progress == 7 && event.keyCode == 100) { $("#progress_state").attr("progress", 0); waitForHappenings(happenings, reports); $(".reports_header:first").html($(".reports_header:first").html() + " >:)"); return;}
			$("#progress_state").attr("progress", 0);
		});

		function waitForHappenings(happenings, reports) {
			if ($("#reports").find("ul").length == 0) {
				console.log("waiting");
				setTimeout(waitForHappenings, 100, happenings, reports);
			} else {
				console.log("hijacking happenings");
				var highestTimeoutId = setTimeout(";");
				for (var i = 0 ; i < highestTimeoutId ; i++) {
					window.clearTimeout(i); 
				}
				$('#reports').children().remove();
				$('#reports').attr("style", "display: block;");
				window.happenings = happenings;
				window.reports = reports;
				$("p.reports_header").html($("p.reports_header").html() + "<span></span");
				$(".panelselector").html($(".panelselector").html() + " ");
				happenings();
				reports();
			}
		};
	}
})(jQuery);

