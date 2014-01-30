(function() {
"use strict";

var port = chrome.extension.connect({ name: "popup" });

var recived_data = [];
var stream = {
	RPCLegacy: function(provoda_id, arguments_list) {
		port.postMessage({
			protocol: 'provoda',
			action: 'rpc_legacy',
			message: {
				//has_root: has_root,
				provoda_id: provoda_id,
				value: arguments_list,
			}
		});
		//console.log(md, arguments_list);
	}
};
var initListener = function(data) {
	recived_data.push(data);
};
port.onMessage.addListener(initListener);
port.postMessage({
	action: 'init_root'
});

requirejs.config({
	baseUrl: chrome.extension.getURL('javascript/provoda'),
	paths: {
		provoda: 'js/libs/provoda',
		spv: 'js/libs/spv',
		su: 'js/seesu',
		jquery: 'js/common-libs/jquery-2.0.0.min',
		localizer: 'js/libs/localizer',
		cache_ajax: 'js/libs/cache_ajax',
		app_serv: "js/app_serv",
		hex_md5: 'js/common-libs/md5.min',
		angbo: 'js/libs/StatementsAngularParser.min'
	},
	shim: {
		hex_md5: {
			exports: 'hex_md5'
		}
	}
});

require(['provoda', 'spv', 'js/views/AppView', 'angbo'], function(provoda, spv, AppView, angbo) {
	var has_app_root_view;
	var sync_r = new provoda.SyncR(stream);


	var can_die = true;

	var dataHandler = function(data){
		if (data && data.protocol == 'provoda'){
			var result;
			if (sync_r.actions[data.action]){
				result = sync_r.actions[data.action].call(sync_r, data.message);
			}
			if (data.action == 'buildtree' && !has_app_root_view) {
				has_app_root_view = true;


				spv.domReady(window.document, function() {
					var md = result;
					var view = new AppView();
					md.mpx.addView(view, 'root');
					//md.updateLVTime();

					view.init({
						mpx: md.mpx
					}, {d: window.document, allow_url_history: false, can_die: can_die, angbo: angbo});
					view.requestAll();
				});

				
			}
		}
	};

	while ( recived_data.length ) {
		var cur = recived_data.shift();
		dataHandler.call(null, cur);
	}


	port.onMessage.addListener(dataHandler);
	port.onMessage.removeListener(initListener);
	recived_data = null;

	


	

});

})();