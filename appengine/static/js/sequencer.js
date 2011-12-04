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

			preroll: 200,	// ms

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
			ctx.fillRect(0, 0, cvsw, cvsh);
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
		// Audio stuff.
		chans = [],

		actx = null,
		abuf = null,

		master = null,
		compressor = null,

		trigger = function (chan, hit, when) {
			if (!chan) {
				return;
			}
			var voice = actx.createBufferSource();
			voice.buffer = chan.buf;
			voice.connect(compressor);
			voice.noteOn(when / 1000.0);
			console.log(chan.index + ': ' + hit + ' - ' + when);
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

				// If time since last draw has exceeded threshold, perform a render.

				// Advance time by a tick.
				last_tick += ms_per_tick;
				tick_count++;

				advance_channels(trigger_time);
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
			start = (1000 * actx.currentTime) + opts.preroll;
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
					play();
				}
			}
			xhr.send();
		},

		reset = function (data) {
			chans = [];
			frame = 0;
			state = 'loading';

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
				chans.push({
					index: i,
					loading: true,
					sample: chan.sound,
					buf: null,
					pat: chan.pat || 'X...',
					pos: 0,
					len: chan.pat.length,
					last_trigger: -1
				});
				load_sample(i, chan.sound);
			}
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
