(function(){
	var puppetHTML = '';
	if (getVisiblePage() == "blank" && window.location.href.contains("?puppet_manager")) {
		window.document.title = "Puppet Manager";
		$("#content").html("<h1>Puppet Management</h1>");
		$("#content").append("<select id='active_puppets'></select>");
		$("#content").append("<select id='puppet_lists'></select>");
	}
})();

