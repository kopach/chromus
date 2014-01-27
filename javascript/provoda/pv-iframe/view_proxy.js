define(['provoda', 'spv', 'angbo', 'jquery', 'js/views/LFMPageView'], function(provoda, spv, angbo, $, LFMPageView) {
"use strict";
//var big_index = {};
debugger;
var stream = {
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
};

var has_app_root_view;
var sync_r = new provoda.SyncR(stream);

var playlists = {};
var playlists_list = [];
var views_storage = {
	playlists: {},
	songs: {}
};



spv.domReady(document, function() {
	$('.playlist').each(function(playlist_num, el) {
		
		if (!playlists[playlist_num]) {
			playlists[playlist_num] = [];
			playlists_list.push(playlists[playlist_num]);
		}
		
		var playlist_array = playlists[playlist_num];

		var song_con = $(el).find('li');
		song_con.each(function(song_num, el) {
			spv.setTargetField(views_storage.songs, [playlist_num, song_num], {
				con: el,
				view_node: null,
				view: null
			});
			var artist_name = $(el).find('.artist_name').text();
			var track_name = $(el).find('.track_name').text();
			playlist_array.push([artist_name, track_name]);
		});

	});

	window.parent.postMessage({
		action: 'init_sender',
		message: playlists_list
	}, window.location.origin);
});


spv.addEvent(window, 'message', function(e) {
	var data  = e.data;
	if (data && data.protocol == 'provoda'){
		var result;
		if (sync_r.actions[data.action]){
			result = sync_r.actions[data.action].call(sync_r, data.message);
		}
		if (data.action == 'buildtree' && !has_app_root_view) {
			has_app_root_view = true;


			var md = result;
			var view = new LFMPageView();
			md.mpx.addView(view, 'root');
			//md.updateLVTime();

			view.init({
				mpx: md.mpx
			}, {d: window.document, angbo: angbo, dom_storage: views_storage});
			view.requestAll();
		}
	}
});

return {};
});