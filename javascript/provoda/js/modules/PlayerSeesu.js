define(['./PlayerComplex', 'app_serv', 'jquery', 'spv',
'js/modules/AudioCoreHTML5', 'js/modules/AudioCoreWmp', 'js/modules/AudioCoreSm2Proxy'], function(PlayerComplex, app_serv, $, spv,
AudioCoreHTML5, AudioCoreWmp, AudioCoreSm2Proxy){
'use strict';
var app_env = app_serv.app_env;
	var su;




	var sm2opts = {};
	if (!app_env.chrome_like_ext){
		if (app_env.opera_extension){
			sm2opts.wmode = 'opaque';
			sm2opts.useHighPerformance = false;
		} else {
			if (app_env.opera_widget){
				sm2opts.wmode = 'transparent';
			}
		}
	}
	

	var done;
	var useLib = function(cb){
		if (!done){
			//done = true;
			cb();
			
		}
	};
	var checkTracking = function(last_try, done){
		if (done){
			su.trackVar(3, 'canplay', 'yes', 1);
		} else if (last_try){
			su.trackVar(3, 'canplay', 'no', 1);
		}
	};

	var use_order_list = ['html5mp3', 'sm2-proxy', 'wmpactivex'];


	var features_storage = {
		features_states: {},
		setAsAccessible: function(feature_name, player_core) {
			this.features_states[feature_name] = player_core;
			this.checkReadyFeature();
		},
		setAsInaccessible: function(feature_name) {
			this.features_states[feature_name] = 'fail';
			this.checkReadyFeature();
		},
		canLoad: function(feature_name) {
			addFeature(feature_name);
		},
		checkReadyFeature: function() {
			var feature_to_use;
			for (var i = 0; i < use_order_list.length; i++) {
				var cur = this.features_states[use_order_list[i]];

				if (!cur){
					break;
				} else if (cur == 'fail') {
					continue;
				} else {
					feature_to_use = cur;
					break;
				}
				
			}
			checkTracking(feature_to_use, use_order_list.length == i);
			if (feature_to_use){
				su.p.setCore(feature_to_use);
			}
			if (!feature_to_use && use_order_list.length == i){
				su.p.setFail();
			}

		}
	};




	var addFeature = function(feature){
		//features[feature];
		switch (feature){
			case "html5mp3":
			//require('./')
				useLib(function() {
					features_storage.setAsAccessible(feature, new AudioCoreHTML5());
				});
				break;
			case "wmpactivex":
				useLib(function() {
					features_storage.setAsAccessible(feature, new AudioCoreWmp());
				});
				break;
			case "sm2-proxy":
				useLib(function() {
					spv.domReady(window.document, function(){

						var only_strings = false;
						try {
							window.postMessage({
								toString: function(){
									only_strings = true;
								}
							},"*");
						} catch(e){}
						sm2opts.modern_messaging = !only_strings;


						var pcore = new AudioCoreSm2Proxy("http://arestov.github.io", "/SoundManager2/?" + su.version, sm2opts);
						var pcon = $(pcore.getC());
						var complete;
						pcon
							.addClass('sm2proxy')
							.attr('scrolling', 'no');

						pcon.on('load', function() {
							setTimeout(function() {
								if (!complete){
									pcon.addClass('long-appearance');
									features_storage.setAsInaccessible(feature);
								}
							}, 7000);
						});
						
						pcore
							.done(function(){
								complete = true;
								setTimeout(function(){
									pcon.addClass('sm2-complete');
								}, 1000);
								features_storage.setAsAccessible(feature, pcore);
								

							})
							.fail(function(){
								complete = true;
								pcon.addClass('hidden');
								features_storage.setAsInaccessible(feature);
							});
						$(function(){
							$(document.body).append(pcon);
						});
					});
				});
				break;
			case "sm2-internal":
				/*
				useLib(function(){
					spv.domReady(window.document, function(){
						yepnope({
							load:  [bpath + 'js/common-libs/soundmanager2.mod.min.js', bpath + 'js/prototypes/player.sm2-internal.js'],
							complete: function(){
								var pcore = new sm2internal(bpath + "swf/", sm2opts);
								var pcon = $(pcore.getC());
								var complete;
								pcon
									.addClass('sm2proxy')
									.attr('scrolling', 'no');
								
								pcon.on('load', function() {
									setTimeout(function() {
										if (!complete){
											pcon.addClass('long-appearance');
										}
									}, 7000);
								});
								pcore
									.done(function(){
										complete = true;
										su.p.setCore(pcore);
										setTimeout(function(){
											pcon.addClass('sm2-complete');
										}, 1000);

									})
									.fail(function(){
										complete = true;
										//pcon.addClass('hidden');
									});
								$(function(){
									$(document.body).append(pcon);
									pcore.appended();
								});
							}
						});
					});

				});*/
				

		}
	};



	


	


	var flash_plgs = spv.filter(spv.toRealArray(navigator.plugins),"name", "Shockwave Flash");
	/*
	var plugins_list = spv.toRealArray(navigator.plugins);
	var vlc_plgs = spv.filter(plugins_list,"name", function(el){
		return el && el.indexOf("VLC") != -1;
	});

	var vlc_plugin = !!vlc_plgs.length;*/
	/*
	var quick_time_plgs = spv.filter(plugins_list,"name", function(el){
		return el && el.indexOf("QuickTime") != -1;
	});
	
	
	var qt_plugin = !!quick_time_plgs.length;
	if (qt_plugin){
		var all_qt_mimetypes = [];
		for (var i = 0; i < quick_time_plgs.length; i++) {
			Array.prototype.push.apply(all_qt_mimetypes, spv.toRealArray(quick_time_plgs[i]));
			//quick_time_plgs[i]
		}
		//"application/x-quicktimeplayer" || "video/quicktime";
		//var ;

		var best_mimetypes = [].concat(
			spv.filter(all_qt_mimetypes, 'type', "application/x-quicktimeplayer"),
			spv.filter(all_qt_mimetypes, 'type', "video/quicktime")
		);
		console.log(best_mimetypes);
	}*/

	

	var detectors = [
		function(h5a){
			h5a = (h5a = document.createElement('audio')) && !!(h5a.canPlayType && h5a.canPlayType('audio/mpeg;').replace(/no/, ''));
			if (h5a){
				features_storage.canLoad('html5mp3');
			} else {
				features_storage.setAsInaccessible('html5mp3');
			}
		},
		function(awmp){
			awmp = document.createElement('object');
			awmp.classid = "CLSID:22d6f312-b0f6-11d0-94ab-0080c74c7e95";
			if ( 'EnableContextMenu' in awmp && awmp.attachEvent ){
				features_storage.canLoad('wmpactivex');
			} else {
				features_storage.setAsInaccessible('wmpactivex');
			}
		}
		

	];
	var want_detecting;

	var detectAudioCores = function() {
		while (!done && detectors.length){
			detectors.shift()();
		}
	};

	
	if (!done){
		spv.domReady(document, function(){
			detectors.push(
				function(){
					return; //code is not finished



					var
						aqt = document.createElement("embed");

					aqt.style.position = "absolute";
					aqt.style.top = "0px";
					aqt.style.left = "0px";
					aqt.width = 300;
					aqt.height = 240;
					aqt.id = aqt.name = "qt_test" + (new Date()).valueOf();

					aqt.setAttribute("EnableJavaScript", true);
					aqt.setAttribute("postdomevents", true);

					aqt.setAttribute("src", "http://www.google-analytics.com/__utm.gif?" + (new Date()).valueOf());

					spv.addEvent(aqt, "qt_error ", function(){
					//	console.log("error!");
					});

					spv.addEvent(aqt, "qt_begin", function(){
					//	console.log("begin!");
					});
					spv.addEvent(aqt, "load", function(){
					//	console.log("load!");
					});

					//check preffered mimetype!!!

					aqt.type= "application/x-quicktimeplayer" || "video/quicktime";
					

					
					//window.dizi = aqt;
					try {
						document.body.appendChild(aqt);
						if (aqt.GetPluginVersion && aqt.GetPluginVersion()){
							addFeature("quicktime");
						}
						//document.body.removeChild(aqt);
					} catch (e){}
					
					
				},
				function(){
					if (flash_plgs.length && app_env.iframe_support && !app_env.tizen_app){
						features_storage.canLoad('sm2-proxy');
					} else {
						features_storage.setAsInaccessible('sm2-proxy');
					}
					
				},
				function(){
					return; //code is not finished


					if (false && !app_env.cross_domain_allowed){
						addFeature("sm2-internal");
					}
				}
			);
			if (want_detecting){
				detectAudioCores();
			}
		});
		
	}











	var PlayerSeesu = function(){};
	PlayerComplex.extendTo(PlayerSeesu, {
		init: function(app){
			this._super();
			this.app = app;
			su = app;
				
			this
			.on('finish', function(e){
				e.song_file.mo.submitPlayed();
			})
			.on('song-play-error', function(song, can_play) {
				if (this.c_song == song){
					if (!can_play){
						if (song.isSearchAllowed() && song.state('search_complete')){
							this.playNext(this.c_song, true);
						} else {
							this.wantSong(song);
						}
						
					} else {
						song.play();
					}
				}
			})
			.on('play', function(e){
				e.song_file.mo.submitNowPlaying();
			});

			var _this = this;


			var setVolume = function(fac){
				if (_this.c_song){
					_this.c_song.setVolume(false, fac);
				} else {
					_this.setVolume(false, false, fac);
				}
				
			};

			su.on('state_change-settings-volume', function(e) {
				if (!e.value) {
					return;
				}
				setVolume(e.value);
			});


			want_detecting = true;
			detectAudioCores();
		},
		events: {
			finish: function(e){
				if (this.c_song == e.song_file.mo){
					this.playNext(this.c_song, true);
				}
			},
			play: function(e){
				if (this.c_song == e.song_file.mo){
					this.playing();
					if (this.c_song.next_preload_song){
						this.c_song.next_preload_song.prefindFiles();
					}
					this.changeAppMode(true);
				}
			},
			pause: function(e){
				if (this.c_song == e.song_file.mo){
					this.notPlaying();
					this.changeAppMode();
				}
			},
			stop: function(e){
				if (this.c_song == e.song_file.mo){
					this.notPlaying();
					this.changeAppMode();
				}
			},
			playing: function(){
				
			}
		},
		setPlayMark: function(playing){
			if (playing){
				this.playing();
			} else {
				this.notPlaying();
			}
		},
		notPlaying: function(){
			su.notPlaying();
			
		},
		playing: function(){
			su.playing();
		},
		changeAppMode: function(playing){
			if (playing){
				if (window.btapp){
					window.btapp.properties.set('background', true);
				}
			} else{
				if (window.btapp){
					window.btapp.properties.set('background', false);
				}
			}
		},
		nowPlaying: function(mo){
			su.nowPlaying(mo);
		}
	});

		

	



return PlayerSeesu;
});
