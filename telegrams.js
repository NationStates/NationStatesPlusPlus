function doTelegramSetup() {
	if (typeof _commonsLoaded == 'undefined') {
		setTimeout(doTelegramSetup, 50);
	} else {
		if (isSettingEnabled("clickable_telegram_links")) {
			linkifyTelegrams();
		}
	}
}
doTelegramSetup();

function linkifyTelegrams() {
	if (getVisiblePage() == "telegrams" || getVisiblePage() == "tg") {
		$(".tgcontent").children("p").each(function() {
			if ($(this).attr('class') != "replyline") {
				$(this).html(linkify($(this).html()));
			}
		});
	}
}