/*jslint bitwise: true, regexp: true, sloppy: false, sub: false, vars: false, plusplus: true, maxerr: 50, indent: 4 */
/*global jQuery, TECHNO, FONT */
"use strict";

var TECHNO = (function (module, $) {
	var defaults = {
		chars_wide: 12,
		min_lines: 4,
		fg: '#f28500',
		hi: '#ffbf00',
		bg: '#000000'
	},
	opts = {},

	container = null,	// Canvas' parent container.
	cvs = null,			// Canvas.
	ctx = null,			// Canvas 2d context.
	cvsw = 0,			// Canvas width in pixels.
	cvsh = 0,			// Canvas height in pixels.

	lines = [],	// Oldest to newest lines of text.
	cols = 12,	// Number of columns on screen.
	rows = 8,	// Rows that can be displayed on screen.
	cx = 0,		// Cursor position in characters.
	cy = 0,		// 0,0 is top left.
	cx_px = 0,	// Cursor position in pixels.
	cy_py = 0,	// 0, 0 is top left.
	cur = 0,	// Cursor state: -1 off, 0/1 blink state.

	// ========================================
	// Font rendering.
	scale_x = 1,
	scale_y = 1,
	rect_immediate = function (x, y, w, h) {
		ctx.fillRect(cx_px + (x * scale_x), cy_py + (y * scale_y),
					 w * scale_x, h * scale_y);
	},
	cmd_queue = [],
	last_cmd = null,
	exec_cmd = function () {
		// Pop first cmd off queue.
		// If last cmd was a stroke, restroke it with fg.
		// If this cmd is a stroke then stroke it with hi.

		// If queue not empty, set timeout for next execution
		// with randomised duration around 50ms, tending towards
		// shorter delays with longer queue lengths.
	},
	rect_deferred = function (x, y, w, h) {
		//  If queue empty, start the stroke sequence.
		cmd_queue.push({
			cmd: 's',
			x: cx_px + (x * scale_x),
			y: cy_py + (y * scale_y),
			w: w * scale_x,
			h: h * scale_y
		});
	},
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

		rect: rect_immediate
	},
	// Width and height of a character, originally at unity scaling.
	charw_px = font_cfg.width + font_cfg.step,
	charh_px = font_cfg.bothigh + font_cfg.tophigh + font_cfg.step,
	// Inset into the character grid, originally at unity scaling.
	char_inset_px = font_cfg.step / 2,
	// Horizontal inset for the character grid to be centred.
	horiz_inset_px = 0,

	// ========================================
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

		// Re-display last lines of text.
	},
	display_init = function (canvas, options) {
		$.extend(opts, defaults, options);

		cvs = canvas;
		ctx = canvas.getContext('2d');
		container = $(cvs).parent();

		display_resized();

		// Hook up resize detection.
	},

	// ========================================
	newline = function (fat) {
		var offset = fat ? 2 : 1;
		cy += offset
		cx = 0;
		if (cy >= rows) {
			// TODO: Scroll lines up.
			// Push scroll up command into queue.
			cy -= offset;
		}
	},

	print = function (msg, fat) {
		var i, l, kar;

		if (fat) {
			scale_x *= 2;
			scale_y *= 2;
			charw_px *= 2;
			charh_px *= 2;
		}

		// For each character in message,
		// calculate and queue it's glyph strokes.
		for(i = 0, l = msg.length; i < l; ++i) {
			kar = msg[i];

			if (kar != ' ' && kar != '\n') {
				cx_px = (cx * charw_px) + char_inset_px + horiz_inset_px;
				cy_py = ((cy + 1) * charh_px) - char_inset_px;

				FONT.render(font_cfg, 0, 0, kar);
			}

			// Update cursor position.
			if (kar == '\n') {
				newline(fat);
			} else {
				++cx;
				if (cx >= cols) {
					newline(fat);
					kar = '\n';
				}
			}
		}
		if (kar != '\n') {
			newline(fat);
		}
		if (fat) {
			scale_x /= 2;
			scale_y /= 2;
			charw_px /= 2;
			charh_px /= 2;
		}
	};

	// ========================================
	return $.extend(module, {
		display_init: display_init,
		display_resized: display_resized,
		print: print
	});
}(TECHNO || {}, jQuery));
