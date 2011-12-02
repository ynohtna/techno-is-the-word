/*jslint bitwise: true, regexp: true, sloppy: false, sub: false, vars: false, plusplus: true, maxerr: 50, indent: 4 */
/*global jQuery, setTimeout, TECHNO, FONT */
"use strict";

var TECHNO = (function (module, $) {
	// ========================================
	// Module setup.
	var defaults = {
		chars_wide: 12,
		min_lines: 4,

		fg: '#f28500',
		hi: '#ffbf00',
		bg: '#000000',
		alt: '#85f200',
		cur: '#00f285',

		cur_ms: 100
	},
	opts = {},

	// ========================================
	// DOM interaction.
	container = null,	// Canvas' parent container.
	cvs = null,			// Canvas.
	ctx = null,			// Canvas 2d context.
	cvsw = 0,			// Canvas width in pixels.
	cvsh = 0,			// Canvas height in pixels.

	// ========================================
	// Cursor state.
	cols = 12,	// Number of columns on screen.
	rows = 8,	// Rows that can be displayed on screen.
	cx = 0,		// Cursor position in characters.
	cy = 0,		// 0,0 is top left.
	cx_px = 0,	// Cursor position in pixels.
	cy_px = 0,	// 0, 0 is top left.
	cur = 0,	// Cursor blink state: 0, 1.
	curx = 0,

	// ========================================
	// Font configuration.
	font_cfg = {
		width: 12,
		space: 12,
		step: 2,

		bothigh: 7,
		tophigh: 5,
		sidethick: 2,
		botthick: 2,
		midthick: 2,
		topthick: 2,

		rect: null
	},
	// Width and height of a character, originally at unity scaling.
	charw_px = font_cfg.width + font_cfg.step,
	charh_px = font_cfg.bothigh + font_cfg.tophigh + font_cfg.step,
	// Inset into the character grid, originally at unity scaling.
	char_inset_px = font_cfg.step / 2,
	// Horizontal inset for the character grid to be centred.
	horiz_inset_px = 0,

	// ========================================
	// Display state.
	scale_x = 1,
	scale_y = 1,
	alt_colour = false,
	alt_clr = function (alt) {
		var clr = opts.alt,
		clri;
		if (typeof alt == "number") {
			clri = 'alt' + alt;
			if (clri in opts) {
				clr = opts[clri];
			}
		}
		return clr;
	},

	// ========================================
	// Initialization.
	display_resized = function () {
		// Determine size of canvas.
		if (!ctx) {
			return;
		}

		// Resize canvas to size of parent element.
		cvsw = container.width();
		cvsh = container.height();

		cvs.width = cvsw;
		cvs.height = cvsh;

		ctx.fillStyle = opts.bg;
		ctx.globalCompositeOperation = 'src-over';
		ctx.fillRect(0, 0, cvsw, cvsh);

		ctx.fillStyle = opts.fg;

		// Calculate appropriate font scaling to ensure
		// sufficient characters can be displayed.
		while (cols * charw_px * (scale_x + 1) < cvsw &&
			   rows * charh_px * (scale_y + 1) < cvsh) {
			scale_x++;
			scale_y++;
		}
		charw_px *= scale_x;
		charh_px *= scale_y;
		char_inset_px *= scale_x;

		rows = Math.floor(cvsh / charh_px);

		// Calculate horizontal inset for centering.
		horiz_inset_px = Math.floor((cvsw - (cols * charw_px)) / 2);

		// Re-display last lines of text?
	},
	display_init = function (canvas, options) {
		$.extend(opts, defaults, options);

		cols = opts.chars_wide;

		cvs = canvas;
		ctx = canvas.getContext('2d');
		container = $(cvs).parent();

		display_resized();

		font_cfg.rect = rect_deferred;
	},

	calc_px_pos = function () {
		cx_px = (cx * charw_px) + char_inset_px + horiz_inset_px;
		cy_px = ((cy + 1) * charh_px) - char_inset_px;
	},

	// ========================================
	// Display manipulators.
	rect_immediate = function (x, y, w, h) {
		ctx.fillStyle = alt_colour ? alt_clr(alt_colour) : opts.fg;
		ctx.fillRect(cx_px + (x * scale_x), cy_px + (y * scale_y),
					 w * scale_x, h * scale_y);
	},
	scroll_now = function (px) {
		ctx.drawImage(cvs, 0, px, cvsw, cvsh - px,
					  0, 0, cvsw, cvsh - px);
		ctx.fillStyle = opts.bg;
		ctx.fillRect(0, cvsh - px, cvsw, px);
	},
	clear_line = function () {
		ctx.fillStyle = opts.bg;
		ctx.fillRect(cx_px, cy_px, cvsw - cx_px, -charh_px);
	},
	draw_cursor = function (on) {
		var w = font_cfg.step * scale_x;
		curx = cx_px - (cx > 0 ? w : 0);
		ctx.fillStyle = (on && cur) ? opts.cur : opts.bg;
		ctx.fillRect(curx, cy_px, w, -charh_px >> 1);
		cur = 1 - cur;
	},

	// ========================================
	// Display commands handlers.
	cmd_queue = [],
	cmd_timer = null,
	last_cmd = null,
	exec_cmd = function () {
		// Pop first cmd off queue.
		var cmd = cmd_queue.shift(),
		maxsleep = 10,
		minsleep = 2,
		sleep = 10;

		if ((cmd || last_cmd) && cur >= 0) {
			draw_cursor(false);
		}

		// If last cmd was a stroke, restroke it with fg.
		if (last_cmd) {
			if (last_cmd.cmd === 's') {
				ctx.fillStyle = last_cmd.alt ? alt_clr(last_cmd.alt) : opts.fg;
				ctx.fillRect(last_cmd.x, last_cmd.y, last_cmd.w, last_cmd.h);
			} else if (last_cmd.cmd === 't') {
				$(cvs).trigger(last_cmd.type, last_cmd.params);
			}
			last_cmd = null;
		}

		// If this cmd is a stroke then stroke it with hi.
		if (cmd) {
			if (cmd.cmd === 's') {
				ctx.fillStyle = opts.hi;
				ctx.fillRect(cmd.x, cmd.y, cmd.w, cmd.h);
			} else if (cmd.cmd === 'p') {
				maxsleep *= 20;
				minsleep *= 20;
			} else if (cmd.cmd === 'P') {
				maxsleep *= 30;
				minsleep *= 30;
			} else if (cmd.cmd === '^') {
				scroll_now(cmd.px);
				maxsleep = minsleep = 1;
			} else if (cmd.cmd === 'c') {
				clear_line();
			} else if (cmd.cmd === 't') {
				// Intentionally empty: event triggers are sent via last cmd.
			}
			last_cmd = cmd;
		} else if (!last_cmd && cur >= 0){
			maxsleep = opts.cur_ms;
			draw_cursor(true);
		}

		// If queue not empty, set timeout for next execution.
		if (cmd_queue.length || last_cmd || cur >= 0) {
			sleep = Math.max(minsleep, maxsleep - (cmd_queue.length / 10));
			cmd_timer = setTimeout(exec_cmd, sleep);
		} else {
			clearInterval(cmd_timer);
			cmd_timer = null;
		}
	},
	start_deferred = function () {
		if (!cmd_timer) {
			var startdelay = 10;
			if (last_cmd && last_cmd.cmd === 'p') {
				startdelay = 200;
			}
			cmd_timer = setTimeout(exec_cmd, startdelay);
		}
	},
	show_cursor = function (show) {
		if (show) {
			cur = 1;
			start_deferred();
		} else {
			cur = -1;
			draw_cursor(false);
		}
	},
	rect_deferred = function (x, y, w, h) {
		cmd_queue.push({
			cmd: 's',
			alt: alt_colour,
			x: cx_px + (x * scale_x),
			y: cy_px + (y * scale_y),
			w: w * scale_x,
			h: h * scale_y
		});
		start_deferred();
	},
	do_pause = function (long) {
		cmd_queue.push({
			cmd: long ? 'P' : 'p'
		});
		start_deferred();
	},
	do_scroll = function (pixels, o) {
		var shift = charh_px >> 1;
		if (o && 'immediate' in o && o.immediate) {
			scroll_now(pixels);
		} else {
			while (pixels > 0) {
				cmd_queue.push({
					cmd: '^',
					px: Math.min(pixels, shift)
				});
				pixels -= shift;
			}
			start_deferred();
		}
	},
	do_event = function (type, o) {
		var params = (o && 'params' in o) ? o.params : [];
		if (o && 'immediate' in o && o.immediate) {
			$(cvs).trigger(type || 'display', params);
		} else {
			cmd_queue.push({
				cmd: 't',
				type: type || 'display',
				params: params
			});
			start_deferred();
		}
	},
	do_clear = function (o) {
		if (o && 'immediate' in o && o.immediate) {
			clear_line();
		} else {
			cmd_queue.push({
				cmd: 'c'
			});
			start_deferred();
		}
	},

	// ========================================
	scroll = function (rows, o) {
		rows = rows || 1;
		do_scroll(rows * charh_px, o);
	},

	newline = function (o) {
		var offset = (o && 'fat' in o && o.fat) ? 2 : 1,
		pauseline = o && 'pause_line' in o && o.pause_line,
		immed = o && 'immediate' in o && o.immediate;

		cy += offset;
		cx = 0;
		if (cy >= rows) {
			scroll(offset, o);
			cy -= offset;
		}
		calc_px_pos();
		if (pauseline && !immed) {
			do_pause(true);
		}
	},

	print = function (msg, o) {
		var i, l, kar,
		fat, alt, pausekar, pauseline, runon,
		event, immed, cr, clr, cursor;

		if (o) {
			fat = 'fat' in o && o.fat;
			alt = 'alt' in o && o.alt;
			pausekar = 'pause_kar' in o && o.pause_kar;
			pauseline = 'pause_line' in o && o.pause_line;
			runon = 'runon' in o && o.runon;
			event = 'event' in o && o.event;
			immed = 'immediate' in o && o.immediate;
			cr = 'carriage_return' in o && o.carriage_return;
			clr = 'clear_line' in o && o.clear_line;
			cursor = 'cursor' in o && o.cursor;
		}

		if (fat) {
			scale_x *= 2;
			scale_y *= 2;
			charw_px *= 2;
			charh_px *= 2;
		}

		if (alt) {
			alt_colour = (typeof o.alt == 'number') ? o.alt : true;
		} else {
			alt_colour = false;
		}

		if (immed) {
			font_cfg.rect = rect_immediate;
		}

		if (cr) {
			cx = 0;
		} else if (cx >= cols) {
			newline(o);
		}

		calc_px_pos();

		if (clr) {
			do_clear(o);
		}

		// Erase cursor and disable it during rendering.
		show_cursor(false);

		// For each character in message,
		// calculate and queue it's glyph strokes.
		for(i = 0, l = msg ? msg.length : 0; i < l; ++i) {
			kar = msg[i];

			if (kar != ' ' && kar != '\n') {
				FONT.render(font_cfg, 0, 0, kar);
				if (pausekar && !immed) {
					do_pause();
				}
			}

			// Update cursor position.
			if (kar == '\n') {
				newline(o);
			} else {
				++cx;
				cx_px += charw_px;
				if (cx > cols) {
					newline(o);
				}
			}
		}
		if (immed) {
			font_cfg.rect = rect_deferred;
		}
		if (!runon && kar != '\n') {
			newline(o);
		}
		if (alt) {
			alt_colour = false;
		}
		if (fat) {
			scale_x /= 2;
			scale_y /= 2;
			charw_px /= 2;
			charh_px /= 2;
		}
		if (event) {
			do_event(event, o);
		}
		if (cursor) {
			show_cursor(true);
		}
	};

	// ========================================
	return $.extend(module, {
		display_init: display_init,
		display_resized: display_resized,

		print: print,
		newline: newline,
		scroll: scroll,

		clear_line: do_clear,
		pause: do_pause,

		show_cursor: show_cursor,
		push_event: do_event
	});
}(TECHNO || {}, jQuery));
