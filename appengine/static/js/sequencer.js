/*jslint bitwise: true, regexp: true, sloppy: false, sub: false, vars: false, plusplus: true, maxerr: 50, indent: 4 */
/*global jQuery, setTimeout */
"use strict";

(function ($) {

	$.fn.sequencer = function (options) {
		if (this.length > 1) {
			this.each(function () {
				$(this).player(options);
			});
			return this;
		} else if (this.length < 1) {
			return null;
		}

		var defaults = {
			chans: 1,
			srate: 44100.0,
			nyquist: 22050,
			bufsize: 1024,

			preroll: 50,		// ms
			frame_interval: 40,	// ms

			bg: '#000',
			fg: '#fff'
		},
		opts = $.extend({}, defaults, options),
		self = this.get(0),
		$self = $(self),

		container = null,
		ctx = null,
		cvsw = 0,
		cvsh = 0,
		chanh = 1,

		rows = 8,
		cols = 16,
		gx = 1,
		gy = 1,
		ox = 0,
		oy = 0,

		frame = 0,

		state = 'loading',
		bpm = 128,
		ticks_per_beat = 4,
		samples_per_tick = 5000,
		ms_per_tick = 18000,

		last_draw = -100,

		start = 0,		// ms
		now = 0,		// ms
		last_tick = 0,	// ms
		tick_count = 0,

		init = function () {
			container = $self.parent();
			ctx = self.getContext('2d');

			cvsw = container.width();
			cvsh = container.height();
			self.width = cvsw;
			self.height = cvsh;

			console.log('cvsw: ' + cvsw + ', cvsh: ' + cvsh);

			ctx.fillStyle = opts.bg;
			ctx.globalCompositeOperation = 'src-over';
//			ctx.globalAlpha = 0.2;
//			ctx.fillRect(0, 0, cvsw, cvsh);
			ctx.fillStyle = opts.fg;

			while (cols * (gx + 1) < cvsw && rows * (gy + 1) < cvsh) {
				gx++;
				gy++;
			}
			ox = Math.floor((cvsw - (cols * gx)) / 2);
			oy = Math.floor((cvsh - (rows * gy)) / 2);
			console.log('gx: ' + gx + ', gy: ' + gy + ', ox: ' + ox + ', oy: ' + oy);
		},

		// ------------------------------------------------------------
		// Helper stuff.
		random = function (min, max) {
			return min + (Math.random() * (max - min));
		},

		hsv2rgb = function (h, s, v) {
			var r, g, b, var_r, var_g, var_b, RGB = new Array();
			if (s == 0){
				RGB['red'] = RGB['green'] = RGB['blue'] = Math.round(v * 255);
			} else {
				// h must be < 1
				var var_h = h * 6;
				if (var_h == 6) {
					var_h = 0;
				}
				var var_i = Math.floor(var_h);
				var var_1 = v*(1-s);
				var var_2 = v*(1-s*(var_h-var_i));
				var var_3 = v*(1-s*(1-(var_h-var_i)));
				if(var_i==0){
					var_r = v;
					var_g = var_3;
					var_b = var_1;
				}else if(var_i==1){
					var_r = var_2;
					var_g = v;
					var_b = var_1;
				}else if(var_i==2){
					var_r = var_1;
					var_g = v;
					var_b = var_3
				}else if(var_i==3){
					var_r = var_1;
					var_g = var_2;
					var_b = v;
				}else if (var_i==4){
					var_r = var_3;
					var_g = var_1;
					var_b = v;
				}else{
					var_r = v;
					var_g = var_1;
					var_b = var_2;
				}
				RGB['red']=Math.round(var_r * 255);
				RGB['green']=Math.round(var_g * 255);
				RGB['blue']=Math.round(var_b * 255);
			}
			return RGB;
		},

		mk_hsv = function (hue, sat, val) {
			var rgb = hsv2rgb(hue, sat, val);
			return 'rgb(' + rgb['red'] + ',' + rgb['green'] + ',' + rgb['blue'] + ')';
		},

		// ============================================================
		render = function (chans, now) {
			for (var i = 0, l = chans.length, chan; i < l; i++) {
				chan = chans[i];
				var ytop = i * chanh,
				time_since_hit = now - chan.last_hit,
				h = (i / l), s = chan.last_vel, v;
				if (time_since_hit >= 0) {
					v = 0;
				} else if (time_since_hit > -50) {
					v = time_since_hit / -50.0;
				}
//				console.log('now: ' + now + ', time since last hit: ' + time_since_hit);
				ctx.fillStyle = mk_hsv(h, s, v);
				ctx.fillRect(ox, ytop, cols * gx, chanh);
			}
		},

		// ------------------------------------------------------------
		// Audio stuff.
		chans = [],

		actx = null,
		abuf = null,

		master = null,
		compressor = null,

		get_voice = function (chan, which, vel) {
			var gain = actx.createGainNode(),
			voice = actx.createBufferSource();
			voice.buffer = chan.buf;
			voice.connect(gain);
			gain.gain.value = vel;
			gain.connect(compressor);
			return voice;
		},

		trigger = function (chan, hit, when) {
			if (!chan) {
				return;
			}
			var voice, vel;
			if (hit == 'x') {
				vel = chan.soft;
				voice = get_voice(chan, 'soft-voice', vel);
			} else if (hit == '-') {
				vel = chan.grace;
				voice = get_voice(chan, 'grace-voice', vel);
			} else {
				vel = chan.hard;
				voice = get_voice(chan, 'hard-voice', vel);
			}
			voice.noteOn(when / 1000.0);
//			console.log(chan.index + ': ' + hit + ' - ' + when);
			chan.last_hit = when - start;
			chan.last_vel = vel;
		},

		advance_channels = function (trigger_time) {
			for (var i = 0, l = chans.length, chan, hit; i < l; i++) {
				chan = chans[i];
				chan.pos++;
				if (chan.pos >= chan.len) {
					chan.pos = 0;
				}
				hit = chan.pat[chan.pos];
				if (hit != '.' && hit != ' ') {
					trigger(chan, hit, trigger_time);
				}
			}
		},

		tick = function () {
			var trigger_time;
			now = (1000 * actx.currentTime) - start;	// ms since playback started.
			while (last_tick < now + opts.preroll) {
				trigger_time = last_tick + start;

				// Advance time by a tick.
				last_tick += ms_per_tick;
				tick_count++;

				advance_channels(trigger_time);
			}
			if (now - last_draw > opts.frame_interval) {
				render(chans, now);
				last_draw = now;
			}
			if (state == 'playing') {
				setTimeout(tick, 0);
			}
		},

		play = function () {
			if (state == 'playing') {
				return;
			}
			state = 'playing';
			start = 1000 * actx.currentTime;
			last_tick = 0;
			last_draw = -100,
			tick_count = 0;
			console.log('start: ' + start);
			tick();
		},
		stop = function () {
			state = 'stopped';
		},

		// ------------------------------------------------------------
		all_loaded = function () {
			for (var i = 0, l = chans.length, chan; i < l; i++) {
				chan = chans[i];
				if (chan.loading) {
					return false;
				}
			}
			return true;
		},

		load_sample = function (chan_idx, url) {
			var xhr = new XMLHttpRequest();
			xhr.open("GET", url, true);
			xhr.responseType = "arraybuffer";

			xhr.onload = function () {
				var buf = actx.createBuffer(xhr.response, true /* mix to mono*/),
				voice = actx.createBufferSource(),
				chan = chans[chan_idx];

				chan.buf = buf;
				voice.buffer = buf;
				voice.connect(compressor);
				chan.voice = voice;
				chan.loading = false;

				console.log('LOADED ' + url + ' into channel ' + chan_idx)
				if (all_loaded()) {
					state = 'ready-to-play';
				}
			}
			xhr.send();
		},

		loady = 0,
		loading_anim = function () {
			if (state != 'loading') {
				ctx.clearRect(0, 0, cvsw, cvsh);
				play();
			} else {
				var width = random(gy, gy * 2),
				hue = Math.floor(random(0, 8)) / 8.0,
				val = random(0.5, 1.0),
				clr = mk_hsv(hue, 0.8, val);

//				console.log(clr);

				ctx.fillStyle = clr;
				ctx.fillRect(ox, oy + loady, gx * cols, width);

				loady += random(0, gy * 2);
				if (loady > cvsh) {
					loady = 0;
				}

				setTimeout(loading_anim, opts.frame_interval / 2);
			}
		},

		reset = function (data) {
			chans = [];
			frame = 0;
			loady = 0;

			bpm = data.bpm || 128;
			samples_per_tick = (opts.srate * 60) / (bpm * ticks_per_beat);
			ms_per_tick = (1000 * 60) / (bpm * ticks_per_beat);
			console.log('bpm: ' + bpm + ', samples_per_tick: ' + samples_per_tick + ', ms_per_tick: ' + ms_per_tick);

			if (!data || !data.chans) {
				return;
			}
			for (var i = 0, l = data.chans.length, chan; i < l; i++) {
				chan = data.chans[i];
				console.log(i + ': ' + chan.sound + '- ' + chan.pat);
				console.log(chan);
				chans.push({
					index: i,
					loading: true,
					sample: chan.sound,
					buf: null,
					hard: chan.hard || 0.7,
					soft: chan.soft || 0.4,
					grace: chan.grace || 0.1,
					pat: chan.pat || 'X...',
					pos: 0,
					last_hit: -1,
					last_vel: 0.5,
					len: chan.pat.length,
					last_trigger: -1
				});
				load_sample(i, chan.sound);
			}
			chanh = cvsh / chans.length;

			state = 'loading';
			loading_anim();
		};

		// ------------------------------------------------------------
		// Verify browser support for the needed audio framework.
		if (typeof AudioContext == 'function') {
			actx = new AudioContext();
		} else if (typeof webkitAudioContext == 'function') {
			actx = new webkitAudioContext();
		}

		if (!actx) {
			alert('You need Chrome for audio playback.');
			return;
		}

		abuf = actx.createBuffer(opts.chans, opts.bufsize, opts.srate);
		master = actx.createGainNode();
		master.gain.value = 0.7;
		master.connect(actx.destination);

		if (actx.createDynamicsCompressor) {
			console.log('COMPRESSOR');
			compressor = actx.createDynamicsCompressor();
			compressor.connect(master);
		} else {
			compressor = master;
		}

		init();

		// ------------------------------------------------------------
		return {
			init: init,
			reset: reset,
			play: play,
			stop: stop
		};
	};

}(jQuery));
