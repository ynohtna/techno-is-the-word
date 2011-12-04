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
			alt: '#ff0',
			alt1: '#fe0',
			alt2: '#f0f',
			alt3: '#808',
		},
		opts = $.extend({}, defaults, options),
		self = this.get(0),
		$self = $(self),

		container = $self.parent(),
		$container = $(container),

		word ='',
		word_state = -1,
		state = 'intro',
		nada_count = 0,

		T = TECHNO,
		S = opts.seq,

		// ----------------------------------------
		punctuation_lookup = ':=,-.',
		input_opts = {
			alt: 1,
			carriage_return: true,
			clear_line: true,
			runon: true,
			immediate: true,
			cursor: true
		},

		process_opts = {
			alt: 3,
			carriage_return: true,
			clear_line: true,
			runon: true,
			immediate: true
		},

		// ----------------------------------------
		anim_cfg = {
			ms: 100,
			kars: '~~~~~~~~~~~~',
			c: 0
		},
		anim = function (no_loop) {
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
			}
			if (!no_loop) {
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

		// ----------------------------------------
		seq_data = null,
		start_player = function() {
			console.log('start_player');
			console.log(seq_data);
			$container.addClass('sequencer-ready');
		},

		// ----------------------------------------
		restart_input = function () {
			// Restart input cycle.
			nada_count = 0;
			T.print('\nword:', { event: 'display', params: 'start_input' });
		},

		ajax_error = function (xhr/*, status, error*/) {
			// Stop processing animation.
			anim_cfg.c = -1;

			T.print('error!', { alt: 2,
								carriage_return: true,
								clear_line: true,
								immediate: true
							  });
			if (xhr) {
				T.print(xhr.responseText ? xhr.responseText.toLowerCase()
						: xhr.statusText.toLowerCase(),
						{ alt: 2 });
			} else {
				T.print('failure', { alt: 2 });
			}
			restart_input();
		},

		poll = function (doit) {
			if (anim_cfg.c <= 24) {
				// Not yet time to poll.
				anim(true);
				setTimeout(poll, anim_cfg.ms);
				return;
			}

			// Request processing update status.
			$.ajax({
				url: '/status/' + word,
				data: { state: word_state },
				dataType: 'json',
				success: function (response, status, xhr) {
					// Stop processing animation.
					anim_cfg.c = -1;

					if (response) {
						// Clear line, show cleansed word
						// and status messages, reset nada count.
						word_state = response.state;
						log_msgs(response.txt);
						nada_count = 0;

						console.log('state: ' + word_state);
						console.log(response.txt);

						if (response.result) {
							try {
								seq_data = $.parseJSON(response.result);
							} catch (e) {
								console.log('BAD JSON! ' + response.result);
							}
							state = 'seq-ready';
							T.print('\n--==~~~~==--', { alt: false });
							T.print('! finished !', { alt: true })
							T.print('--==~~~~==--', { alt: false });
							T.push_event('start_player');
							T.print('\n\n\n\n\n\n\n');
							T.print('\n--==~~~~==--', { alt: false });
							T.print('  click to', { alt: true });
							T.print('    play', { alt: true });
							T.print('--==~~~~==--\n\n', { alt: false });
							return;
						}
					} else if (xhr.status == 304) {
						nada_count += 1;
						if (nada_count >= 20) {
							T.print('\ntimed out!\ntry again...\n', { alt: 2 });

							// Restart input cycle.
							restart_input();
							return;
						}
					}

					// Continue polling for processing updates.
					T.push_event('start_polling');
				},
				error: ajax_error
			});
		},

		start_polling = function () {
			state = 'polling';
			anim_cfg.c = 0;
			setTimeout(poll, anim_cfg.ms);
		},

		// ----------------------------------------
		send_word = function () {
			T.show_cursor(false);
			state = 'sending';

			// Send word request to server.
			$.ajax({
				url: '/status/' + word,
				dataType: 'json',
				success: function (response, status) {
					// Stop processing animation.
					anim_cfg.c = -1;

					if (response) {
						// Clear line, show cleansed word
						// and status messages.
						word = response.word || 'techno';
						word_state = response.state || 0;
						T.print(word, { carriage_return: true,
										alt: true,
										clear_line: true,
										immediate: true
									  });

						log_msgs(response.txt);
					}

					// Start polling for processing updates.
					T.push_event('start_polling');
				},
				error: ajax_error
			});

			// Start progress indicator.
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
			word_state = -1;
			state = 'input';
			T.show_cursor(true);
		};

		// ----------------------------------------
		$self.bind('display', function (event, param) {
			start_input();
		});
		$self.bind('start_polling', start_polling);
		$self.bind('start_player', start_player);

		// Capture keyboard input.
		$(document).keydown(keydown);
		$container.bind('click', function (e) {
			if ($container.hasClass('sequencer-ready')) {
				console.log('STARTING SEQUENCER!');
				e.preventDefault();
				$container.removeClass('sequencer-ready').addClass('sequencer');
				state = 'seq';
				S.reset(seq_data);
			} else if ($container.hasClass('sequencer')) {
				S.stop();
				$container.removeClass('sequencer');
				T.print('\n   thanks\n   for da\n    beat\n    bud!\n\n\n\n');
				T.print('word:', { event: 'display', params: 'start_input' });
			}
		});

		// Initialise display module.
		T.display_init(self, opts);

		// Display intro text.
/*/
		T.print('0123456789.,');
		T.print('abcdefghijkl');
		T.print('mnopqrstuvwx');
		T.print('yz~<>{!=+-;"');
		T.print('\'|:%~*€');
/**/
		T.print('techno', { fat: true, alt: true, pause_kar: true });
		T.print('is the word!', { alt: true, pause_line: true });
		T.print('------------');
/**/
		T.newline();
		T.print('word:', { event: 'display', params: 'start_input' });

		return self;
	};

}(jQuery));
