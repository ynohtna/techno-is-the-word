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
			bg: '#000'
		},
		self = this.get,
		opts = $.extend({}, defaults, options);

		self.shout = function (what) {
			TECHNO.print(what || opts.fg);
		};
		self.options = function () {
			return opts;
		};

		// Initialise display module.
		TECHNO.display_init(this.get(0), opts);

		// Include font.
		// Feed intro text to renderer.
		// Receive input.
		// Send input to server, instantiating communications channel.
		// Receive updates over channel.
		// Receive final calculated data.
		// Reboot.

		return self;
	};

}(jQuery));
