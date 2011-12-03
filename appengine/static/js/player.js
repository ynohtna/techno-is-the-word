/*jslint bitwise: true, regexp: true, sloppy: false, sub: false, vars: false, plusplus: true, maxerr: 50, indent: 4 */
/*global jQuery, setTimeout */
"use strict";

(function ($) {

	$.fn.player = function (options) {
		if (this.length > 1) {
			this.each(function () {
				$(this).player(options);
			});
			return this;
		} else if (this.length < 1) {
			return null;
		}

		var defaults = {
			loaders: '.player-load',
			mime_needed: 'audio/x-wav'
		},
		opts = $.extend({}, defaults, options),
		self = this.get(0),
		$self = $(self),

		playing = 0,
		src = null,

		play_btn = $('.play', self),
		stop_btn = $('.stop', self),

		player = document.createElement('audio'),
		$player = $(player),

		play = function () {
			if (!playing && src) {
				$player.attr('src', src);
				console.log('PLAYING! ' + src);
				player.play();
				playing = 1;
			}
			if (e) {
				e.preventDefault();
			}
		},
		stop = function (e) {
			if (playing) {
				console.log('STOPPING!');
				playing = 0;
				player.pause();
			}
			if (e) {
				e.preventDefault();
			}
		};

		// ------------------------------------------------------------
		// Verify browser support for the needed audio format.
		if (!player || !player.canPlayType) {
			alert('Sorry, your browser does not support the HTML5 audio element.');
		} else if (player.canPlayType(opts.mime_needed) == "") {
			alert('Sorry, your browser does not support our required audio formats.');
		}

		$player.attr({
			controls: true,
			autoplay: false,
			loop: true,
			preload: 'auto',
			autobuffer: 'autobuffer'
		});

		// ------------------------------------------------------------
		// Wire up interaction controls.
		play_btn.click(play);
		stop_btn.click(stop);

		// ------------------------------------------------------------
		$(opts.loaders).live('click', function (e) {
			if (e) {
				e.preventDefault();
			}
			stop();
			src = $(this).data('player-src');
			play();
		});

		return self;
	};

}(jQuery));
