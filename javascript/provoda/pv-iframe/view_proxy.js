define(['provoda', 'spv', 'angbo', 'jquery', 'js/views/LFMPageView', './parser'], function(provoda, spv, angbo, $, LFMPageView, parser) {
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

var views_storage = {};



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
			message: window.collected_data
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

	var findParent = function(element, class_name){
		var parent_node = element.parentNode;

		while (parent_node) {
			var className = parent_node.className;
			if (className && className.indexOf(class_name) != -1) {
				return parent_node;
			}
			parent_node = parent_node.parentNode;
		}
		return null;
	};

	var storage = parser(window.document, views_storage);

	window.collected_data = storage.data;

	parsed = true;
	current_port.postMessage({
		action: 'init_sender',
		message: window.collected_data
	});

	var content_node = document.querySelector('div#content');

	if (content_node && window.MutationObserver) {
		var mut_obr = new window.MutationObserver(function() {


			var storage = parser(window.document, views_storage);

			window.collected_data = storage.data;
			window.views_storage = storage.views;

			if (root_view) {
				root_view.mpx.RPCLegacy('updateLFMPData', window.collected_data);
			}
		});
		mut_obr.observe(content_node, {
			childList: true
		//	subtree: true
		});
	}


});



return {};
});