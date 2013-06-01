(function(){
	// Add jquery.caret script
	var script = document.createElement('script');
	script.src = 'http://capitalistparadise.com/nationstates/v1_4/jquery.caret.js';
	script.addEventListener('load', function() { });
	document.head.appendChild(script);

	// Add jquery.highlight script
	var script = document.createElement('script');
	script.src = 'http://capitalistparadise.com/nationstates/v1_4/jquery.highlight.js';
	script.addEventListener('load', function() { });
	document.head.appendChild(script);

	// Add css stylesheet
	var style = document.createElement('link');
	style.setAttribute('rel', 'stylesheet');
	style.setAttribute('type', 'text/css');
	style.setAttribute('href', 'http://capitalistparadise.com/nationstates/v1_4/bootstrap-button.css');
	document.head.appendChild(style);

	// Add NationStates++ script
	var script = document.createElement('script');
	script.src = 'http://capitalistparadise.com/nationstates/v1_4/nationstates++.js';
	script.addEventListener('load', function() { });
	document.head.appendChild(script);

})();