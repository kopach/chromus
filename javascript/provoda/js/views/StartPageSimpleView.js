define(['provoda', 'jquery', 'app_serv'], function(provoda, $, app_serv) {
"use strict";

var SongFileModelUI = function() {};
provoda.View.extendTo(SongFileModelUI, {
	dom_rp: true,
	getProgressWidth: function() {
		return this.tpl.ancs['progress_c'].width();
	},
	complex_states: {
		
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








var ActionsRowUI = function(){};
provoda.View.extendTo(ActionsRowUI, {
	bindBase: function() {
	},
	getCurrentButton: function() {
		var active_part = this.state('active_part');
		if (active_part){
			return this.tpl.ancs['bt' + active_part];
		}
	},
	getArPaOffset: function() {
		return this.tpl.ancs['arrow'].offsetParent().offset();
	},
	getCurrentButtonOWidth: function() {
		var current_button = this.getCurrentButton();
		return current_button.outerWidth();
	},
	getCurrentButtonOffset: function() {
		var current_button = this.getCurrentButton();
		return current_button.offset();
	},
	'compx-arrow_pos':{
		depends_on: ['#window_width', 'active_part'],
		fn: function(window_width, active_part) {
			if (window_width && active_part){
				var button_width = this.getBoxDemension(this.getCurrentButtonOWidth, 'button_owidth', active_part);
				//ширина кнопки, зависит типа вьюхи и активной части

				var button_offset = this.getBoxDemension(this.getCurrentButtonOffset, 'button_offset', window_width, active_part);
				//расположение кнопки, зависит от ширины окна и названия части

				var parent_offset = this.getBoxDemension(this.getArPaOffset, 'arrow_parent_offset', window_width);
				//расположенние позиционного родителя стрелки, зависит от ширины окна

				return ((button_offset.left + button_width/2) - parent_offset.left) + 'px';
			}
		}
	}
});



var LfmLoginView = function() {};

provoda.View.extendTo(LfmLoginView, {
	'stch-has_session': function(state){
		if (!state){
			this.c.removeClass("hidden");
		} else {
			this.c.addClass("hidden");
		}
	},
	'stch-deep-sandbox': function(state){
		this.c.toggleClass('deep-sandbox', !!state);
	},
	'stch-data_wait': function(state) {
		if (state){
			this.c.addClass("waiting-auth");
		} else {
			this.c.removeClass("waiting-auth");
		}
	},
	'stch-request_description': function(state) {
		this.c.find('.lfm-auth-request-desc').text(state || "");
	},
	createBase: function() {
		this.c = this.root_view.getSample('lfm_authsampl');
		this.auth_block = this.c.children(".auth-block");
		var _this = this;
		var auth_link = this.auth_block.find('.lastfm-auth-bp a').click(function(e){
			_this.RPCLegacy('requestAuth');
			e.preventDefault();
		});
		this.addWayPoint(auth_link);
		this.code_input = this.auth_block.find('.lfm-code');
		var use_code_button = this.auth_block.find('.use-lfm-code').click(function(){
			var value = _this.code_input.val();
			if (value){
				_this.RPCLegacy('useCode', value);
			}
			return false;
		});
		this.addWayPoint(use_code_button);
	}
});

var LfmScrobbleView = function(){};
LfmLoginView.extendTo(LfmScrobbleView, {
	createBase: function(){
		this._super();
		this.scrobbling_switchers = this.root_view.getSample('lfm_scrobling').appendTo(this.c);
		this.chbx_enabl = this.scrobbling_switchers.find('.enable-scrobbling');
		this.chbx_disabl = this.scrobbling_switchers.find('.disable-scrobbling');
		var _this = this;
		

		this.chbx_enabl.click(function() {
			_this.RPCLegacy('setScrobbling', true);
		});
		this.chbx_disabl.click(function() {
			_this.RPCLegacy('setScrobbling', false);
		});
		this.addWayPoint(this.chbx_enabl, {
			
		});
		this.addWayPoint(this.chbx_disabl, {
			
		});
	},
	"stch-has_session": function(state) {
		state = !!state;
		this.c.toggleClass('has_session', state);
		this.auth_block.toggleClass('hidden', state);
		this.chbx_enabl.add(this.chbx_disabl).prop('disabled', !state);
	},
	"stch-scrobbling": function(state) {
		this.chbx_enabl.prop('checked', !!state);
		this.chbx_disabl.prop('checked', !state);
	}
});
var LfmLoveItView = function() {};
LfmLoginView.extendTo(LfmLoveItView, {
	createBase: function() {
		this._super();
		var _this = this;
		var wrap = $('<div class="add-to-lfmfav"></div>');

		this.nloveb = this.root_view.createNiceButton();
		this.nloveb.c.appendTo(wrap);
		this.nloveb.b.click(function(){
			if (_this.nloveb._enabled){
				_this.RPCLegacy('makeLove');
			}
		});
		this.addWayPoint(this.nloveb.b);
		this.nloveb.b.text(app_serv.localize('addto-lfm-favs'));
		this.c.append(wrap);
		
	
	},
	"stch-has_session": function(state) {
		state = !!state;
		this.c.toggleClass('has_session', state);
		this.auth_block.toggleClass('hidden', state);
		this.nloveb.toggle(state);
	},
	"stch-wait_love_done": function(state){
		this.c.toggleClass('wait_love_done', !!state);
	}
});



var LoveRowUI = function(){};
provoda.View.extendTo(LoveRowUI, {
	children_views: {
		lfm_loveit: LfmLoveItView
	},

	"stch-active_view": function(state){
		if (state){
			if (this.expand){
				this.expand();
			}
		}
	},
	expand: function(){
		if (this.expanded){
			return;
		} else {
			this.expanded = true;
		}
		this.c.append(this.getAFreeCV('lfm_loveit'));
		this.requestAll();
	}
});



var ScrobbleRowUI = function(){};
provoda.View.extendTo(ScrobbleRowUI, {
	children_views: {
		lfm_scrobble: LfmScrobbleView
	},
	"stch-active_view": function(state){
		if (state){
			if (this.expand){
				this.expand();
			}
		}
	},
	expand: function() {
		if (this.expanded){
			return;
		} else {
			this.expanded = true;
		}

		this.c.append(this.getAFreeCV('lfm_scrobble'));
		this.requestAll();
	}
	
});

var SongActionsRowUI = function() {};
ActionsRowUI.extendTo(SongActionsRowUI, {
	dom_rp: true,
	bindBase: function(){
		this._super();

		this.createVolumeControl();
		
		this.wch(this.parent_view, 'mp_show', function(e){
			this.setVisState('is_visible', !!e.value);
		});

	},

	children_views: {
		'row-lastfm': {
			main: ScrobbleRowUI
		},
		'row-love': {
			main: LoveRowUI
		}
		/*
		"row-repeat-song": {
			main: RepeatSongRowView
		},
		
		,
		'row-share': {
			main: ShareRowUI
		},
		'row-tag': {
			main: SongActTaggingControl
		},
		'row-playlist-add': {
			main: SongActPlaylistingUI
		*/
	},

	getVHoleWidth: function() {
		return this.tpl.ancs['v-hole'].width();
	},
	getVBarOuterWidth: function() {
		return this.tpl.ancs['v-bar'].outerWidth();
	},
	getVBarWidth: function() {
		return this.tpl.ancs['v-bar'].width();
	},

	complex_states: {
		"vis_volume-hole-width": {
			depends_on: ['vis_is_visible', 'vis_con_appended'],
			fn: function(visible, apd){
				if (visible && apd){
					return this.getBoxDemension(this.getVHoleWidth, 'volume-hole-width');
				}
				
			}
		},
		"vis_volume-bar-max-width": {
			depends_on: ['vis_volume-hole-width'],
			fn: function(vvh_w){
				if (vvh_w){
					return  vvh_w - ( this.getBoxDemension(this.getVBarOuterWidth, 'v-bar-o-width') - this.getBoxDemension(this.getVBarWidth, 'v-bar-width'));
				}
				
			}
		},
		"vis_volume": {
			depends_on: ['volume', 'vis_volume-bar-max-width'],
			fn: function(volume_fac, vvb_mw){
				if (typeof volume_fac =='undefined'){
					return 'auto';
				} else if (vvb_mw){
					return Math.floor(volume_fac * vvb_mw) + 'px';
				} else {
					return (volume_fac * 100)  + '%';
				}
			}
		}
	},
	createVolumeControl: function() {
		this.vol_cc = this.tpl.ancs['volume-control'];
		//this.tpl = this.getTemplate(this.vol_cc);


		var events_anchor = this.vol_cc;
		var pos_con = this.tpl.ancs['v-hole'];

		this.dom_related_props.push('vol_cc', 'tpl');
		var _this = this;

		var getClickPosition = function(e, node){
			//e.offsetX ||
			var pos = e.pageX - $(node).offset().left;
			return pos;
		};

		var path_points;
		var volumeChange = function(){
			var last = path_points[path_points.length - 1];

			//promiseStateUpdate
			//setVisState
			var hole_width = _this.state('vis_volume-hole-width');
			if (!hole_width){
				console.log("no width :!((");
			}
			var twid = Math.min(hole_width, Math.max(0, last.cpos));

			_this.promiseStateUpdate('volume', twid/hole_width);
			_this.RPCLegacy('setVolume', [twid, hole_width]);
			/*
			if (!_this.width){
				_this.fixWidth();
			}
			_this.RPCLegacy('setVolumeByFactor', _this.width && (last.cpos/_this.width));
			*/

		};

		var touchDown = function(e){
			path_points = [];
			e.preventDefault();
			path_points.push({cpos: getClickPosition(e, pos_con), time: e.timeStamp});
			volumeChange();
			events_anchor.addClass('interactive-state');
		};
		var touchMove = function(e){

			if (e.which && e.which != 1){
				return true;
			}
			e.preventDefault();
			path_points.push({cpos: getClickPosition(e, pos_con), time: e.timeStamp});
			volumeChange();
		};
		var touchUp = function(e){

			if (e.which && e.which != 1){
				return true;
			}
			$(events_anchor[0].ownerDocument)
				.off('mouseup', touchUp)
				.off('mousemove', touchMove);

			var travel;
			if (!travel){
				//
			}
			events_anchor.removeClass('interactive-state');

			path_points = null;

		};
		events_anchor.on('mousedown', function(e){

			$(events_anchor[0].ownerDocument)
				.off('mouseup', touchUp)
				.off('mousemove', touchMove);

			if (e.which && e.which != 1){
				return true;
			}

			$(events_anchor[0].ownerDocument)
				.on('mouseup', touchUp)
				.on('mousemove', touchMove);

			touchDown(e);

		});
	}
});




var CurrentSongView = function() {};
provoda.View.extendTo(CurrentSongView, {


	children_views: {
		actionsrow: SongActionsRowUI,
		current_mopla: CurrentSongMoplaView,
		mf_cor: MfcorPopupView,
	},
	'collch-actionsrow': true,
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