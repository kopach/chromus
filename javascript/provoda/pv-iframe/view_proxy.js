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

	// Tabs when switching in charts
	if (window.MutationObserver) {
		var i, cur, cur_parent;
		var tabs = document.querySelectorAll('.horizontalOptions');

		var parents, cur_parent;

		var reportChanges = function() {
			if (root_view) {
				root_view.mpx.RPCLegacy('updateLFMPData', window.collected_data);
			}
		};

		var bindClick = function(el, parent) {
			el.addEventListener('click', function(){
				setTimeout(function() {
					window.manager.wrapMusicElements(parent);
					reportChanges();
				}, 100);
			}, false);
			
		};

		parents = [];
		for (i=0; i<tabs.length; i++){
			cur = tabs[i];
			cur_parent = findParent(cur, 'module');
			if (!cur_parent) {
				continue;
			}
			if (cur_parent && parents.indexOf(cur_parent) == -1) {
				parents.push( cur_parent );
			}
			bindClick(tabs[i], cur_parent);
			/*tabs[i].addEventListener('click', function(){
				setTimeout(function(){manager.wrapMusicElements(false)}, 1000)
			}, false);*/
		}
		tabs = null;




		var bindCons = function(parents) {
			parents.forEach(function(el) {
				var changesHandler = function() {
					window.manager.wrapMusicElements(el);
					reportChanges();
				};
				var mut_obr = new window.MutationObserver(changesHandler);
				mut_obr.observe(el, {
					childList: true
				//	subtree: true
				});
				//window.manager.wrapMusicElements();
			});
		};
		bindCons(parents);

		var page_switchers = document.querySelectorAll('.nextPage, .previousPage');
		if (page_switchers.length) {
			parents = [];

			var pages_cons = document.querySelectorAll('#pages .page');

			for (i = 0; i < pages_cons.length; i++) {
				
				cur_parent = pages_cons[i] && pages_cons[i].parentNode;
				if (cur_parent && parents.indexOf(cur_parent) == -1) {
					parents.push( cur_parent );
				}
			}
			bindCons(parents);
			


		}

		/*for (var i = 0; i < page_switchers.length; i++) {
			bindClick(page_switchers[i]);
		}*/

	}
	

	window.manager.wrapMusicElements();

	parsed = true;
	current_port.postMessage({
		action: 'init_sender',
		message: window.collected_data
	});


});



return {};
});