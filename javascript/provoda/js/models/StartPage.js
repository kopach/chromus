define(['js/libs/BrowseMap', 'app_serv', 'spv', './SongsList', 'provoda'],
function(BrowseMap, app_serv, spv, SongsList, provoda) {
"use strict";


var morph_map = new spv.MorphMap({
	props_map: {
		artist: '0',
		track: '1'
	}
});


var LFMPagePlalists = function() {};
BrowseMap.Model.extendTo(LFMPagePlalists, {
	model_name: 'lfmsite_page',
	init: function(opts, data) {
		this._super(opts);
		var list = new Array(data.length);
		for (var i = 0; i < data.length; i++) {
			list[i] = this.getTestPlaylist(data[i]);
			list[i].updateState('item_num', i);
		}
		this.updateNesting('main_list', list);
	},
	getTestPlaylist: function(playlist_items) {
		var playlist_title = 'test playlist';
		var playlist = this.app.createSonglist(this, {
			title: playlist_title,
			type: "cplaylist",
			data: {name: playlist_title}
		});

		playlist.tickRequestedData(false, morph_map.execute(playlist_items));

		var song_list = playlist.getNesting('songs-list');

		for (var i = 0; i < song_list.length; i++) {
			song_list[i].updateState('item_num', i);
		}

		return playlist;
	}
});



var StartPage = function() {};
var app_env = app_serv.app_env;
var localize = app_serv.localize;
BrowseMap.Model.extendTo(StartPage, {
	model_name: 'start_page',
	page_name: 'start page',
	zero_map_level: true,
	showPlaylists: function(){
		su.search(':playlists');
	},
	createLFMPagePlaylists: function(list_of_lists) {
		var md = new LFMPagePlalists();
		md.init({
			map_parent: this,
			app: this.app
		}, list_of_lists);
		this.full_list.push(md);
		this.updateNesting('lfm_pages', this.full_list);
		return md;

	},
	init: function(opts){
		this._super(opts);
		this.su = opts.app;
		this.updateState('needs_search_from', true);
		this.updateState('nav_title', 'Seesu start page');
		this.updateState('nice_artist_hint', this.app.popular_artists[(Math.random()*10).toFixed(0)]);

//		this.updateNesting('pstuff', this.getSPI('users/me', true));
//		this.updateNesting('muco', this.getSPI('conductor', true));

		this.full_list = [];
		
		this.wch(this.app, 'current_song_id', function(e) {
			if (e.value) {
				this.updateNesting('current_playlist', this.app.p.c_song.map_parent);
			}
		});

/*
		


for (var i=0; i < saved_pl.length; i++) {
			p.addDataItem(saved_pl[i]);
		}


matched.add(mo);



tickRequestedData(false, []);
*/


	//	return this.app.createSonglist(this, params);



		this.closed_messages = app_serv.store('closed-messages') || {};
		return this;
	},
	rpc_legacy: {
		requestSearchHint: function() {
			var artist = this.state('nice_artist_hint');
			this.app.search(artist);
			this.updateState('nice_artist_hint', this.app.popular_artists[(Math.random()*10).toFixed(0)]);
			su.trackEvent('Navigation', 'hint artist');
		}
	},
	subPageInitWrap: function(Constr, full_name, params) {
		var instance = new Constr();
			instance.init_opts = [{
				app: this.app,
				map_parent: this,
				nav_opts: {
					url_part: '/' + full_name
				}
			}, params];
		return instance;
	},
	short_title: 'Last.fm free music player',
	getTitle: function() {
		return this.short_title;
	},
	messages: {
		"rating-help": function(state){
			if (this.app.app_pages[app_env.app_type]){
				if (state){
					this.updateState('ask-rating-help', this.app.app_pages[app_env.app_type]);
				} else {
					this.updateState('ask-rating-help', false);
				}

			}
		}
	},
	closeMessage: function(message_name) {
		if (this.messages[message_name] && !this.closed_messages[message_name]){
			this.closed_messages[message_name] = true;
			app_serv.store('closed-messages', this.closed_messages, true);
			this.messages[message_name].call(this, false);
		}
	},
	showMessage: function(message_name) {
		if (this.messages[message_name] && !this.closed_messages[message_name]){
			this.messages[message_name].call(this, true);
		}
	}
});
return StartPage;
});