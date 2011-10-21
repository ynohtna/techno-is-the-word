/*jslint bitwise: true, regexp: true, sloppy: false, sub: false, vars: false, plusplus: true, maxerr: 50, indent: 4 */
/*global jQuery, setTimeout, TECHNO */
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
			chars_wide: 12,

			fg: '#fff',
			bg: '#000',
			alt: '#ff0'
		},
		opts = $.extend({}, defaults, options),
		self = this.get(0),
		$self = $(self),

		word ='',
		word_state = -1,
		state = 'intro',

		T = TECHNO,

		// ----------------------------------------
		punctuation_lookup = ':=,-.',
		input_opts = {
			alt: true,
			carriage_return: true,
			clear_line: true,
			runon: true,
			immediate: true,
			cursor: true
		},

		process_opts = {
			carriage_return: true,
			clear_line: true,
			runon: true,
			immediate: true
		},

		// ----------------------------------------
		anim_cfg = {
			ms: 100,
			kars: '----',
			c: 0
		},
		anim = function () {
			var n = anim_cfg.c,
			l = anim_cfg.kars.length,
			l2 = l << 1,
			m = (n % l2),
			mn = m >= l ? l2 - m : m;
			if (n < 0) {
				return;
			} else {
				T.print(anim_cfg.kars.slice(0, mn), process_opts);
				anim_cfg.c++;
				setTimeout(anim, anim_cfg.ms);
			}
		},

		// ----------------------------------------
		log_msgs = function(msgs) {
			var i = 0,
			l = msgs ? msgs.length : 0;
			while(i < l) {
				T.newline();
				T.print(msgs[i++]);
				T.pause(true);
			}
		},

		send_word = function () {
			T.show_cursor(false);
			state = 'sending';

			// AJAX send word to server.
			$.ajax({
				url: '/status/' + word,
				dataType: 'json',
				success: function (response/*, status*/) {
					// Stop processing animation.
					anim_cfg.c = -1;

					// Clear line, show cleansed word
					// and status messages.
					word = response && response.word ? response.word : 'techno';
					T.print(word, { carriage_return: true,
									clear_line: true,
									immediate: true
								  });

					log_msgs(response.txt);

					state = 'polling';
				},
				error: function (xhr/*, status, error*/) {
					// Stop processing animation.
					anim_cfg.c = -1;

					T.print('error!', { alt: true,
										carriage_return: true,
										clear_line: true,
										immediate: true
									  });
					if (xhr) {
						T.print(xhr.responseText ? xhr.responseText.toLowerCase()
								: xhr.statusText.toLowerCase());
					} else {
						T.print('failure');
					}
					T.print('\nword:', { event: 'display', params: 'start_input' });
				}
			});

			// Start progress indicator.
			anim_cfg.kars = '~~~~~~~~~~~~';
			setTimeout(anim, anim_cfg.ms);
		},

		word_changed = function () {
			// Slice out displayable portion of word.
			var slice = word.slice(-12);

			// Clear line and show slice.
			T.print(slice, input_opts);
		},

		keydown = function (event) {
			var key = event.which;

			if (state != 'input') {
				return;
			}

			if (key === 13 && word != '') {	// Enter.
				// Send word, enter server feedback state.
				send_word();
			} else if (key === 8) { // Backspace.
				word = word.slice(0, -1);
				word_changed();
				event.preventDefault();	// Don't go to previous page!
			} else if (key === 32) { // Space.
				word += ' ';
				word_changed();
			} else if (key === 49 && event.shiftKey) {	// Exclamation mark.
				word += '!';
				word_changed();
			} else if (key >= 186 && key <= 190) {		// Misc punctuation.
				word += punctuation_lookup[key - 186];
				word_changed();
			} else if (key >= 65 && key <= 90) {		// Alphabetic character.
				if (!event.metaKey) {
					word += String.fromCharCode(key + 32);
					word_changed();
				}
			}
		},

		start_input = function () {
			word = '';
			state = 'input';
			T.show_cursor(true);
		};

		// ----------------------------------------
		$self.bind('display', function (event, param) {
			start_input();
		});

		// Capture keyboard input.
		$(document).keydown(keydown);

		// Initialise display module.
		T.display_init(self, opts);

		// Display intro text.
		T.print('techno', { fat: true, alt: true, pause_kar: true });
		T.print('is the word!', { alt: true, pause_line: true });
		T.print('------------');
		T.newline();
		T.print('word:', { event: 'display', params: 'start_input' });

		return self;
	};

}(jQuery));
