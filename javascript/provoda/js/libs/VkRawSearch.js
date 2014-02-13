define(['spv', 'hex_md5', 'js/libs/Mp3Search', 'jquery', 'js/modules/wrapRequest'], function(spv, hex_md5, Mp3Search, $, wrapRequest){
"use strict";
var VkRawSearch = function(opts) {
	//this.api = opts.api;
	this.mp3_search = opts.mp3_search;
	this.queue = opts.queue;
	this.cache_ajax = opts.cache_ajax;

};
var standart_props = {
	from: 'vk',
	type: 'mp3',
	media_type: 'mp3'
};
VkRawSearch.prototype = {
	constructor: VkRawSearch,
	name: "vk",
	description: 'vkontakte.ru',
	slave: false,
	preferred: null,
	//q: p.queue,
	s: {
		name: 'vk',
		key: 'nice',
		type: 'mp3'
	},
	dmca_url: 'https://vk.com/dmca',
	makeSong: function(cursor, msq){

		cursor.models = {};
		cursor.getSongFileModel = Mp3Search.getSongFileModel;
		spv.cloneObj(cursor, standart_props);
		if (!cursor.artist){
			var guess_info = Mp3Search.guessArtist(cursor.track, msq && msq.artist);
			if (guess_info.artist){
				cursor.artist = guess_info.artist;
				cursor.track = guess_info.track;
			}
		}
		
		if (msq){
			this.mp3_search.setFileQMI(cursor, msq);
		}
		return cursor;
	},
	cache_namespace: 'vkraw',
	sendRequest: function(query, params, options) {
		options = options || {};
		options.cache_key = options.cache_key || hex_md5('audio' + spv.stringifyParams(params));

	//	var	params_full = params || {};
		//params_full.consumer_key = this.key;


		//cache_ajax.get('vk_api', p.cache_key, function(r){

		var wrap_def = wrapRequest({
			url: 'https://vk.com/audio',
			type: "GET",
			dataType: 'text',
			data: {
				act: 'search',
				al: 1,
				autocomplete: 1,
				gid: 0,
				offset: 0,
				performer: 0,
				q: query,
				sort: 0
			},
			timeout: 20000,
			context: options.context
		}, {
			cache_ajax: this.cache_ajax,
			nocache: options.nocache,
			cache_key: options.cache_key,
			cache_timeout: options.cache_timeout,
			cache_namespace: this.cache_namespace,
			queue: this.queue
		});

		return wrap_def.complex;
	},
	findAudio: function(msq, opts) {
		var
			_this = this,
			query = msq.q ? msq.q: ((msq.artist || '') + (msq.track ?  (' - ' + msq.track) : ''));

		query = query.replace(/\'/g, '').replace(/\//g, ' ');
		opts = opts || {};

		var limit_value =  msq.limit || 30;
		opts.cache_key = opts.cache_key || (query + '_' + limit_value);

		var params_u = {
			results: limit_value
		};

		var async_ans = this.sendRequest(query, params_u, opts);

		var olddone = async_ans.done,
			result;

		async_ans.done = function(cb) {
			olddone.call(this, function(r) {
				if (r.indexOf( 'action="https://login.vk.com/"' ) != -1 ) {
					cb(null, 'mp3');
				}
				if (!result){
					var music_list = [];

					var wrap = document.createElement("div");
					wrap.innerHTML = r;

					var audio_nodes = $(wrap).find('div.audio');


					audio_nodes.each(function(i, el) {
						
						var url_data = $(el).find('input[type=hidden]').val().split(',');
						var url = url_data[0];
						var duration = url_data[1];

						var info_node = $(el).find('.title_wrap');

						var title = info_node.find('span.title').text().trim();
						var artist = info_node.find('b a').text();

						
						var ent = _this.makeSong({
							_id: el.id,
							artist: artist,
							track: title,
							link: url,
							duration: parseFloat(duration) * 1000
						}, msq);
						if (_this.mp3_search.getFileQMI(ent, msq) == -1){
							//console.log(ent)
						} else {
							music_list.push(ent);
						}
					});
					
					result = music_list;
				}
				cb(result, 'mp3');

			});
			return this;
		};
		return async_ans;
	}
};

return VkRawSearch;
});