$(function() {
	var input = $('.sovetnik-trigger input');


	chrome.storage.local.get('sovetnikDisabled', function(obj) {
		input.prop('checked', !!obj.sovetnikDisabled);
	});

	input.on('change input click', spv.debounce(function() {
		var checked = input.prop('checked');
		if (checked) {
			chrome.storage.local.set({sovetnikDisabled: true});
		} else {
			chrome.storage.local.remove("sovetnikDisabled");
		}

		

		
	}, 300));
});