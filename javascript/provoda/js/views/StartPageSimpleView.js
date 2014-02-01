define(['provoda'], function(provoda) {
"use strict";

var CurrentSongCurrentMoplaView = function() {};
provoda.View.extendTo(CurrentSongCurrentMoplaView, {
	base_tree: {
		sample_name: 'song-file'
	}
});


var CurrentSongView = function() {};
provoda.View.extendTo(CurrentSongView, {
	children_views: {
		current_mopla: CurrentSongCurrentMoplaView
	},
	'collch-current_mopla': 'tpl.ancs.current_mopla_con'
});





var StartPageSimpleView = function() {};
provoda.View.extendTo(StartPageSimpleView, {
	children_views: {
		current_song: CurrentSongView
	}
});



return StartPageSimpleView;
});