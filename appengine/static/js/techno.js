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
		$self = $(self),

		word ='',
		T = TECHNO,

		// ----------------------------------------
		punctuation_lookup = ':=,-.',

		keydown = function (event) {
			var key = event.which;

			if (key === 13 && word != '') {	// Enter.
				alert(word);
				word = '';
			} else if (key === 8) { // Backspace.
				word = word.slice(0, -1);
				console.log(word);
			} else if (key === 32) { // Space.
				word += ' ';
				console.log(word);
			} else if (key === 49 && event.shiftKey) { // Exclamation mark.
				word += '!';
				console.log(word);
			} else if (key >= 186 && key <= 190) {	// Misc punctuation.
				word += punctuation_lookup[key - 186];
				console.log(word);
			} else if (key >= 65 && key <= 90) {	// 
				if (!event.metaKey) {
					word += String.fromCharCode(key + 32);
					console.log(word);
				}
			}
		};

		// ----------------------------------------
		$self.bind('display', function (event, param) {
			$(document).keydown(keydown);
		});


		// Initialise display module.
		T.display_init(self, opts);

		// Display intro text.
		T.print('techno', { fat: true, alt: true, pausekar: true });
		T.print('is the word!', { alt: true, pauseline: true });
		T.print('~~~~----~~~~');
		T.newline();
		T.print('word:', { event: 'display', params: 'start_input' });

		// Upon display complete event, start flashing cursor,
		// receive input until enter.

		// Send input to server, instantiating communications channel.
		// Receive updates over channel.
		// Receive final calculated data.
		// Reboot.

		return self;
	};

}(jQuery));
