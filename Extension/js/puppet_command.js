(function(){
	if (getVisiblePage() == "blank" && window.location.href.contains("?puppet_creator")) {
		$("#content").html("<h1>Puppet Creation Center</h1>");
		$("#content").append("<div id='settings'></div>");
		$.get("http://nationstatesplusplus.net/nationstates/v2_1/puppet_creation.html", function(html) {
			$("#settings").html(html);
			$("#settings").find("input").removeAttr("required");
			$("#random_name").on("click", function(event) {
				event.preventDefault();
				$("#puppet_name").val(getRandomName(Math.floor(Math.random() * 12) + 6).toTitleCase());
			});
		});
	}

	function getRandomVowel() {
		var r = Math.floor((Math.random() * 38100));
		if (r < 8167) return 'a';
		if (r < 20869) return 'e';
		if (r < 27835) return 'i';
		if (r < 35342) return 'o';
		return 'u';
	}

	function getRandomConsonant() {
		var r = Math.floor((Math.random() * 34550));
		r += Math.floor((Math.random() * 34550));
		
		if (r < 1492) return 'b';
		if (r < 4274) return 'c';
		if (r < 8527) return 'd';
		if (r < 10755) return 'f';
		if (r < 12770) return 'g';
		if (r < 18864) return 'h';
		if (r < 19017) return 'j';
		if (r < 19789) return 'k';
		if (r < 23814) return 'l';
		if (r < 26220) return 'm';
		if (r < 32969) return 'n';
		if (r < 34898) return 'p';
		if (r < 34993) return 'q';
		if (r < 40980) return 'r';
		if (r < 47307) return 's';
		if (r < 56363) return 't';
		if (r < 57341) return 'v';
		if (r < 59701) return 'w';
		if (r < 59851) return 'x';
		if (r < 61825) return 'y';
		return 'z';
	}

	function generateRandomWord(maxLength) {
		var str = "";
		var nextLetter;
		var length = Math.max(7, maxLength);
		for (var i = 0; i < length; i += 1) {
			var r = Math.floor((Math.random() * 1000));
			if (r < 381) {
				nextLetter = getRandomVowel();
			} else {
				nextLetter = getRandomConsonant();
			}
			if (i == 0) {
				nextLetter = nextLetter.toUpperCase();
			}
			str += nextLetter;
		}
		return str;
	}

	function isValidName(name) {
		var vowelStreak = 0;
		var consonantStreak = 0;

		name = name.toLowerCase();
		for (var i = 0; i < name.length; i += 1) {
			var ch = name[i];
			if (ch == 'a' || ch == 'e' || ch == 'i' || ch == 'o' || ch == 'u') {
				vowelStreak += 1;
				consonantStreak = 0;
			} else {
				consonantStreak += 1;
				vowelStreak = 0;
			}
			if (consonantStreak > 2 || vowelStreak > 2) {
				return false;
			}
		}
		return true;
	}

	function getRandomName(maxLength) {
		while(true) {
			var name = generateRandomWord(maxLength);
			if (isValidName(name)) {
				return name;
			}
		}
	}
})();

