var pageMod = require("sdk/page-mod");
pageMod.PageMod({
  include: "http://www.nationstates.net/region=*",
  contentScript: "(function(){var script = document.createElement('script'); script.type = 'text/javascript'; script.src = 'https://dl.dropboxusercontent.com/u/49805/nationstates%2B%2B.js'; document.head.appendChild(script);})();",
});