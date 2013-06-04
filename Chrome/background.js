(function(){
	// Add jquery.caret script
	var script = document.createElement('script');
	script.src = 'http://capitalistparadise.com/nationstates/v1_5/jquery.caret.js';
	script.addEventListener('load', function() { });
	document.head.appendChild(script);

	// Add jquery.highlight script
	var script = document.createElement('script');
	script.src = 'http://capitalistparadise.com/nationstates/v1_5/jquery.highlight.js';
	script.addEventListener('load', function() { });
	document.head.appendChild(script);

	// Add css stylesheet
	var style = document.createElement('link');
	style.setAttribute('rel', 'stylesheet');
	style.setAttribute('type', 'text/css');
	style.setAttribute('href', 'http://capitalistparadise.com/nationstates/v1_5/bootstrap-button.css');
	document.head.appendChild(style);
	
	// Add jquery no ui slider css
	var style = document.createElement('link');
	style.setAttribute('rel', 'stylesheet');
	style.setAttribute('type', 'text/css');
	style.setAttribute('href', 'http://capitalistparadise.com/nationstates/v1_5/nouislider.fox.css');
	document.head.appendChild(style);
	
	// Add jquery no ui slider
	var script = document.createElement('script');
	script.src = 'http://capitalistparadise.com/nationstates/v1_5/jquery.nouislider.min.js';
	script.addEventListener('load', function() { });
	document.head.appendChild(script);

	// Add NationStates++ script
	var script = document.createElement('script');
	script.src = 'http://capitalistparadise.com/nationstates/v1_5/nationstates++.js';
	script.addEventListener('load', function() { });
	document.head.appendChild(script);

})();