define(['provoda'], function(provoda) {
"use strict";

var SongFileModelUI = function() {};
provoda.View.extendTo(SongFileModelUI, {
	dom_rp: true,
	getProgressWidth: function() {
		return this.tpl.ancs['progress_c'].width();
	},
	complex_states: {
		'visible_duration_text': {
			depends_on: ['visible_duration'],
			fn: function(state) {
				if (state){
					var duration = Math.floor(state/1000);
					if (duration){
						var digits = duration % 60;
						return (Math.floor(duration/60)) + ':' + (digits < 10 ? '0'+ digits : digits );
					}
				}
			}
		},
		"can-progress": {
			depends_on: ['^^vis_is_visible', 'vis_con_appended', 'selected'],
			fn: function(vis, apd, sel){
				var can = vis && apd && sel;
				return can;
			}
		},
		'vis_wp_usable': {
			depends_on: ['overstock', '^^want_more_songs', '^show_overstocked'],
			fn: function(overstock, pp_wmss, p_show_overstock) {

				if (overstock){
					return pp_wmss && p_show_overstock;
				} else {
					return pp_wmss;
				}

			}
		},
		"vis_progress-c-width": {
			depends_on: ['can-progress', '^^want_more_songs', '#window_width'],
			fn: function(can, p_wmss, window_width){
				if (can){
					return this.getBoxDemension(this.getProgressWidth, 'progress_c-width', window_width, !!p_wmss);
				} else {
					return 0;
				}
			}
		},
		"vis_loading_p": {
			depends_on: ['vis_progress-c-width', 'loading_progress'],
			fn: function(width, factor){
				if (factor) {
					if (width){
						return Math.floor(factor * width) + 'px';
					} else {
						return (factor * 100) + '%';
					}
				} else {
					return 'auto';
				}
			}
		},
		"vis_playing_p": {
			depends_on: ['vis_progress-c-width', 'playing_progress'],
			fn: function(width, factor){
				if (factor) {
					if (width){
						return Math.floor(factor * width) + 'px';
					} else {
						return (factor * 100).toFixed(1) + '%';
					}
				} else {
					return 'auto';
				}
			}
		}
	},
	base_tree: {
		sample_name: 'song-file'
	},
	expandBase: function() {


		var progress_c = this.tpl.ancs['progress_c'];

		var _this = this;

		var path_points;
		var positionChange = function(){
			var last = path_points[path_points.length - 1];

			var width = _this.state('vis_progress-c-width');

			if (!width){
				console.log("no width for pb :!((");
			}
			if (width){
				_this.RPCLegacy('setPositionByFactor', [last.cpos, width]);
			}
		};
		var getClickPosition = function(e, node){
			//e.offsetX ||
			var pos = e.pageX - $(node).offset().left;
			return pos;
		};

		var touchDown = function(e){
			path_points = [];
			e.preventDefault();
			path_points.push({cpos: getClickPosition(e, progress_c[0]), time: e.timeStamp});
			positionChange();
		};
		var touchMove = function(e){
			if (!_this.state('selected')){
				return true;
			}
			if (e.which && e.which != 1){
				return true;
			}
			e.preventDefault();
			path_points.push({cpos: getClickPosition(e, progress_c[0]), time: e.timeStamp});
			positionChange();
		};
		var touchUp = function(e){
			if (!_this.state('selected')){
				return true;
			}
			if (e.which && e.which != 1){
				return true;
			}
			$(progress_c[0].ownerDocument)
				.off('mouseup', touchUp)
				.off('mousemove', touchMove);

			var travel;
			if (!travel){
				//
			}


			path_points = null;

		};
		progress_c.on('mousedown', function(e){

			$(progress_c[0].ownerDocument)
				.off('mouseup', touchUp)
				.off('mousemove', touchMove);

			if (!_this.state('selected')){
				return true;
			}
			if (e.which && e.which != 1){
				return true;
			}

			$(progress_c[0].ownerDocument)
				.on('mouseup', touchUp)
				.on('mousemove', touchMove);

			touchDown(e);

		});

	},
	tpl_events: {
		'selectFile': function() {
			if (!this.state('selected')){
				this.RPCLegacy('trigger', 'want-to-play-sf');
			}
		},
		'switchPlay': function(e) {
			var _this = this;
			e.stopPropagation();
			if (_this.state('selected')){

				if (_this.state('play') == 'play'){
					_this.RPCLegacy('pause');
				} else {
					_this.RPCLegacy('trigger', 'want-to-play-sf');
					//_this.RPCLegacy('play');
				}
			} else {
				_this.RPCLegacy('trigger', 'want-to-play-sf');
			}
		}
	}
});

var CurrentSongMoplaView = function() {};
SongFileModelUI.extendTo(CurrentSongMoplaView, {
	"compx-can-progress": {
		depends_on: ['vis_con_appended', 'selected'],
		fn: function(apd, sel){
			var can = apd && sel;
			return can;
		}
	}
});



var FComplectView = function() {};
provoda.View.extendTo(FComplectView, {
	children_views: {
		moplas_list: CurrentSongMoplaView
	},
	'collch-moplas_list': 'tpl.ancs.files_list_con'
});

var MfcorPopupView = function() {};
provoda.View.extendTo(MfcorPopupView, {
	children_views: {
		sorted_completcs: FComplectView
	},
	base_tree: {
		sample_name: 'songs_files'
	}
});

var CurrentSongView = function() {};
provoda.View.extendTo(CurrentSongView, {


	children_views: {
		current_mopla: CurrentSongMoplaView,
		mf_cor: MfcorPopupView
	},
	'collch-current_mopla': 'tpl.ancs.current_mopla_con',
	tpl_events: {
		showFiles: function() {
			this.updateState('want_more_songs', !this.state('want_more_songs'));
		}
	},
	'collch-$ondemand-mf_cor': {
		place: 'tpl.ancs.files_popup',
		needs_expand_state: 'want_more_songs'
	}
});






var StartPageSimpleView = function() {};
provoda.View.extendTo(StartPageSimpleView, {
	children_views: {
		current_song: CurrentSongView
	}
});



return StartPageSimpleView;
});