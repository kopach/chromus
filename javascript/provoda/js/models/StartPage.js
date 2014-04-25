define(['js/libs/BrowseMap', 'app_serv', 'spv', './SongsList', './ArtCard', 'provoda'],
function(BrowseMap, app_serv, spv, SongsList, ArtCard, provoda) {
"use strict";


var morph_map = new spv.MorphMap({
	is_array: true,
	props_map: {
		artist: '0',
		track: '1'
	}
});

var ContextItem = function() {};
provoda.HModel.extendTo(ContextItem, {
	init: function(opts, data) {
		this._super.apply(this, arguments);
		this.item = data.item;
		this.updateState('context_id', data.context_id);
		return this;
	},
	wantPlaying: function() {
		this.item.wantListPlaying();
	}
});

var LFMPagePlalists = function() {};
BrowseMap.Model.extendTo(LFMPagePlalists, {
	model_name: 'lfmsite_page',
	init: function(opts, data) {
		this._super(opts);
		this.playlists_index = {};
		this.artists_index = {};
		this.albums_index = {};

		this.updateLFMPData(data);

		
	},
	updateLFMPData: function(data) {
		this.updateLFMArtists(data.artists);
		this.updateLFMPlaylists(data.playlists);
		this.updateLFMAlbums(data.albums);
	},
	updateLFMPlaylists: function(data) {
		var list = this.getNesting('main_list') || [];
		for (var i = 0; i < data.length; i++) {
			if (!this.playlists_index[data[i][0]]) {
				this.playlists_index[data[i][0]] = true;
				list.push( this.map_parent.createLFMPagePlaylist(data[i]) );
			}
			
			//list[i].updateState('item_num', i);
		}
		this.updateNesting('main_list', list);
	},
	updateLFMArtists: function(list) {
		var models = [];
		for (var i = 0; i < list.length; i++) {
			var id = list[i][0];
			if ( !this.artists_index[id] ) {
				var context_artist = new ContextItem();
				context_artist.init({
					app: this.app,
					map_parent: this
				}, {
					item: this.app.getArtcard(list[i][1]).getTopTracks(),
					context_id: id
				});

				this.artists_index[id] = context_artist;


			}
			models.push( this.artists_index[id] );
			//su.getArtcard("Jai Paul").getTopTracks().wantListPlaying()
		}
		this.updateNesting('artists_list', models);

	},
	updateLFMAlbums: function(list) {
		var models = [];
		for (var i = 0; i < list.length; i++) {
			var id = list[i][0];
			if ( !this.albums_index[id] ) {
				var context_artist = new ContextItem();
				context_artist.init({
					app: this.app,
					map_parent: this
				}, {
					item: this.app.getLFMAlbum(list[i][1], list[i][2]),
					context_id: id
				});

				this.albums_index[id] = context_artist;


			}
			models.push( this.albums_index[id] );
			//su.getArtcard("Jai Paul").getTopTracks().wantListPlaying()
		}
		this.updateNesting('albums_list', models);
	}
});



var StartPage = function() {};
var app_env = app_serv.app_env;
var localize = app_serv.localize;
BrowseMap.Model.extendTo(StartPage, {
	model_name: 'start_page',
	zero_map_level: true,
	createLFMPagePlaylist: function( playlist_info ) {
		var playlist_items = playlist_info[1];
		var playlist_title = 'test playlist';
		var playlist = this.app.createSonglist(this, {
			title: playlist_title,
			type: "cplaylist",
			data: {name: playlist_title}
		});
		playlist.updateState('item_num', playlist_info[0]);
		playlist.insertDataAsSubitems(this.main_list_name, morph_map(playlist_items));

		playlist.raw_playlist_data = playlist_items;

		var song_list = playlist.getNesting('songs-list');

		for (var i = 0; i < song_list.length; i++) {
			song_list[i].updateState('item_num', i);
		}

		return playlist;
	},
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
		this._super.apply(this, arguments);
		this.su = opts.app;
		this.updateState('needs_search_from', true);
		this.updateState('nav_title', 'Seesu start page');
		this.updateState('nice_artist_hint', this.app.popular_artists[(Math.random()*10).toFixed(0)]);
		var _this = this;
		this.updateState('popular_artists', this.app.popular_artists.map(function(el) {
			return {
				artist_name: el,
				url: 'http://last.fm/music/' + _this.app.encodeURLPart(el) + '/+charts'
			};
		}));


		this.full_list = [];
		
		this.wch(this.app, 'current_song_id', function(e) {
			if (e.value) {
				this.updateNesting('current_song', this.app.p.c_song);
				this.updateNesting('current_playlist', this.app.p.c_song.map_parent);

			}
		});
		this.last_lfmpage_playlist = app_serv.store('last_lfmpage_playlist');

		this.on('child_change-current_playlist', function(e) {
			if (e.value) {
				this.updateState('has_current_playlist', true);

				if (e.value.raw_playlist_data != this.last_lfmpage_playlist) {
					this.last_lfmpage_playlist = e.value.raw_playlist_data;
					app_serv.store('last_lfmpage_playlist', this.last_lfmpage_playlist && this.last_lfmpage_playlist.slice(0, 150), true);
				}
			}
			//console.log(e.value, e.target);
		});

		if (this.last_lfmpage_playlist && this.last_lfmpage_playlist.length) {
			this.updateNesting('current_playlist', this.createLFMPagePlaylist([0, this.last_lfmpage_playlist]));
		}

		

		

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
	subPageInitWrap: function(Constr, full_name, data) {
		var instance = new Constr();
		if (!data) {
			data = {};
		}
		data['url_part'] = '/' + full_name;
		return [instance, data];

	},
	sub_pages_routes: {
		'catalog': function(name) {
			var full_name = 'catalog/' + name;
			return this.subPageInitWrap(ArtCard, full_name, {
				urp_name: name,
				artist: name
			});
		},
		/*
		'tracks': function(complex_string, raw_str) {
			var full_name = 'tracks/' + raw_str;
			var parts = this.app.getCommaParts(raw_str);
			if (!parts[1] || !parts[0]){
				return;
			} else {
				return this.subPageInitWrap(SongCard, full_name, {
					artist_name: parts[0],
					track_name: parts[1]
				});
			}
		
		},
		'users': function(name) {
			var full_name = 'users/' + name;
			if (name == 'me'){
				return this.subPageInitWrap(UserCard, full_name);
			} else {
				var name_spaced = name.split(':');
				var namespace = name_spaced[0];
				if (namespace == 'lfm') {
					return this.subPageInitWrap(UserCard.LfmUserCard, full_name, {userid: name_spaced[1]});
				} else if (namespace == 'vk') {
					return this.subPageInitWrap(UserCard.VkUserCard, full_name, {userid: name_spaced[1]});
				}
			}
		},
		'blogs': function(blog_url) {
			var full_name = 'blogs/' +  this.app.encodeURLPart(blog_url);
			return this.subPageInitWrap(MusicBlog, full_name, {
				blog_url: blog_url
			});
		},
		'cloudcasts': function(mixcloud_urlpiece) {
			var full_name = 'cloudcasts/' +  this.app.encodeURLPart(mixcloud_urlpiece);
			return this.subPageInitWrap(Cloudcasts, full_name, {
				key: mixcloud_urlpiece
			});
		}
		


		*/
	},
	sub_pa: {
	/*	
		'tags': {
			title: localize('Pop-tags'),
			constr: TagsList
		},
		'conductor': {
			title: localize('music-cond'),
			constr: MusicConductor
		}

*/
	},
	subPager: function(parsed_str, path_string) {
		var parts = path_string.split('/');
		var first_part = parts[0];
		var full_name = first_part;

		if (parts[1]){
			full_name += '/' + parts[1];
		}
		if (!this.sub_pages[full_name]){
			if (!parts[1]){
				return;
			}
			var handler = this.sub_pages_routes[first_part];
			var instance_data = handler && handler.call(this, decodeURIComponent(parts[1]), parts[1]);
			var instance;
			if (instance_data) {
				if (Array.isArray(instance_data)) {
					instance = instance_data[0];
				} else {
					instance = instance_data;
				}
			}
			if (instance){
				this.sub_pages[full_name] = instance;
			}
			return instance_data;
		}
		return this.sub_pages[full_name];
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