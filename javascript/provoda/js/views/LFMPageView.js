define(['provoda', 'jquery', 'spv'], function(provoda, $, spv) {
"use strict";
/*
 {{player_song && 'player_song'}} 
 {{play && 'playing-song'}}
  {{marked_as && 'v-song-sibling'}} 
  {{marked_as == 'next' && 'to-play-next'}} 
  {{marked_as == 'prev' && 'to-play-previous'}} 
  {{vmp_show && 'viewing-song'}} 
  {{vis_lite_view && vmp_show && 'selected_song'}} 
 */
var song_sample = {
	string: '<a class="sm2_button" href="javascript:void()" pv-events="click:showSong">▶</a>',
	sampler: null,
	root_node: document.createElement('span')
};


var getSample = function(obj, PvTemplate) {
	if (!obj.sampler) {
		if (obj.string) {
			song_sample.root_node.innerHTML = song_sample.string;
		}
		obj.sampler = new PvTemplate.SimplePVSampler(song_sample.root_node);
	}

	return $(obj.sampler.getClone());
};
/*

sampler = this.samples[sample_name] = new PvTemplate.SimplePVSampler(sample_node);
if (sampler.getClone){
	return $(sampler.getClone());
}
*/


var SongView = function() {};
provoda.View.extendTo(SongView, {
	createBase: function() {
		this.c = getSample(song_sample, this.PvTemplate);
		this.createTemplate();
		var outside_comment_node = spv.getTargetField(this.root_view.dom_storage.songs, [this.parent_view.state('item_num'), this.undetailed_states.item_num]);
		$(outside_comment_node).after(this.c);
	},
	tpl_events: {
		showSong: function(e) {
			e.preventDefault();
			this.RPCLegacy('wantSong');
			this.RPCLegacy('requestPage');

		}
	}
});


var PlaylistView = function() {};
provoda.View.extendTo(PlaylistView, {
	children_views: {
		'songs-list': SongView
	},
	'collch-songs-list': true
});
/*
function(nesting_name, array) {
		console.log(this.root_view.dom_storage, array);
	}
	*/



var LFMPageView = function() {};
provoda.View.extendTo(LFMPageView, {
	manual_states_connect: true,
	location_name: 'root_view',
	createDetails: function() {
		this.root_view = this;
		this.dom_storage = this.opts.dom_storage;
		this.completeDomBuilding();
	},
	completeDomBuilding: function() {
		this.connectStates();
		this.connectChildrenModels();
		this.requestAll();
	},
	children_views: {
		main_list: PlaylistView
	},
	'collch-main_list': true
	
});

return LFMPageView;
});