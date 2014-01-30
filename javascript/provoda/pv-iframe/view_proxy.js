define(['provoda', 'spv', 'angbo', 'jquery', 'js/views/LFMPageView'], function(provoda, spv, angbo, $, LFMPageView) {
"use strict";
//var big_index = {};

var Stream = function(port) {
	this.port = port;
};
Stream.prototype.RPCLegacy = function(provoda_id, arguments_list) {
	this.port.postMessage({
		protocol: 'provoda',
		action: 'rpc_legacy',
		message: {
			//has_root: has_root,
			provoda_id: provoda_id,
			value: arguments_list,
		}
	});
	//console.log(md, arguments_list);
};





/*var stream = {
	RPCLegacy: function(provoda_id, arguments_list) {
		window.parent.postMessage({
			protocol: 'provoda',
			action: 'rpc_legacy',
			message: {
				//has_root: has_root,
				provoda_id: provoda_id,
				value: arguments_list,
			}
		}, window.location.origin);
		//console.log(md, arguments_list);
	}
};*/
var parsed;
var root_view;
var sync_r;
var current_port;
var check_interval;
var initPort = function() {
	
	var port = chrome.extension.connect({ name: "page" });
	current_port = port;
	sync_r = new provoda.SyncR(new Stream(port));

	port.onMessage.addListener(function(data){
		if (data && data.protocol == 'provoda'){
			var result;
			if (sync_r.actions[data.action]){
				result = sync_r.actions[data.action].call(sync_r, data.message);
			}
			if (data.action == 'buildtree' && !root_view) {
				var md = result;
				var view = new LFMPageView();
				md.mpx.addView(view, 'root');
				//md.updateLVTime();

				view.init({
					mpx: md.mpx
				}, {d: window.document, angbo: angbo, dom_storage: views_storage});
				view.requestAll();
				root_view = view;
			}
		}
	});
	port.onDisconnect.addListener(function() {
		root_view.die();
		root_view = null;
		port = current_port = null;
	});

	if (parsed) {
		current_port.postMessage({
			action: 'init_sender',
			message: playlists_list
		});
	}

};


/*var playlists = {};
var playlists_list = [];
var views_storage = {
	playlists: {},
	songs: {}
};*/

initPort();

spv.domReady(document, function() {

	// Tabs when switching in charts
	//var tabs = document.querySelectorAll('.horizontalOptions, .nextPage, .previousPage');

	
	/*for(var i=0; i<tabs.length; i++){
		tabs[i].addEventListener('click', function(){
			setTimeout(function(){manager.wrapMusicElements(false)}, 1000)
		}, false);
	}
	tabs = null;*/

	manager.wrapMusicElements();

	parsed = true;
	current_port.postMessage({
		action: 'init_sender',
		message: playlists_list
	});


});



return {};
});