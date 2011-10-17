/*jslint bitwise: true, regexp: true, sloppy: false, sub: false, vars: false, plusplus: true, maxerr: 50, indent: 4 */
/*global jQuery, TECHNO */
"use strict";

(function ($) {

	$.fn.techno = function (options) {
		if (this.length > 1) {
			this.each(function () {
				$(this).techno(options);
			});
			return this;
		}

		var defaults = {
			fg: '#fff',
			bg: '#000',
			alt: '#ff0'
		},
		opts = $.extend({}, defaults, options),
		self = this.get(0),

		T = TECHNO;

		self.options = function () {
			return opts;
		};

		// Initialise display module.
		T.display_init(self, opts);

		// Display intro text.
		T.print('techno', { fat: true, alt: true, pausekar: true });
		T.print('is the word!', { pauseline: true });
		T.newline();
		T.print('-+=~.::.~=+-', { pausekar: true });
		T.newline();
		T.print('word:', { alt: true });

		// Upon display complete event, start flashing cursor,
		// receive input until enter.

		// Send input to server, instantiating communications channel.
		// Receive updates over channel.
		// Receive final calculated data.
		// Reboot.

		return self;
	};

}(jQuery));
