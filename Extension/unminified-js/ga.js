var _gaq = _gaq || [];
function update(delay){
	setTimeout(function() {
		_gaq.push(['_setAccount', 'UA-41267101-1']);
		_gaq.push(['_trackPageview']);
		_gaq.push(['_setCustomVar', 1, 'Version', 'v2.3.0', 2]);

		if (delay == 1) {
			_gaq.push(['_trackEvent', 'NationStates', 'URL', window.location.href]);
		}
		update(60000);
	}, delay);
}
update(1);