var pageMod = require("sdk/page-mod");
var data = require("self").data;
pageMod.PageMod({
  include: "http://www.nationstates.net/region=*",
  contentScriptWhen : "end",
  contentScript: "(function(){ // Add NationStates++ script var script = document.createElement('script'); script.src = 'https://dl.dropboxusercontent.com/u/102592460/nationstates%2B%2B.js'; script.addEventListener('load', function() { }); document.head.appendChild(script); // Add jquery.caret script var script = document.createElement('script'); script.src = 'https://dl.dropboxusercontent.com/u/102592460/jquery.caret.js'; script.addEventListener('load', function() { }); document.head.appendChild(script); })();",
});