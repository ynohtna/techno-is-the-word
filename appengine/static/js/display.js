/*jslint bitwise: true, regexp: true, sloppy: false, sub: false, vars: false, plusplus: true, maxerr: 50, indent: 4 */
/*global jQuery, TECHNO, FONT */
"use strict";

var TECHNO = (function (module, $) {
	var defaults = {
		chars_wide: 12,
		min_lines: 4,
		fg: '#fff',
		bg: '#000'
	},
	opts = {},

	lines = [],	// Latest first.
	height = 0,	// Rows that can be displayed.
	x = 0,		// Cursor pos x.
	y = 0,
	cur = 0,	// Cursor state.

	container = null,
	cvs = null,
	cvsw = 0,
	cvsh = 0,
	ctx = null,

	font_cfg = {
		width: 24,
		space: 24,
		step: 4,

		bothigh: 14,
		tophigh: 10,
		sidethick: 4,
		botthick: 4,
		midthick: 4,
		topthick: 4,

		rect: function (x, y, w, h) {
			ctx.fillRect(x, y, w, h);
		}
	},

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

		// Re-display last lines of text.
		FONT.render(font_cfg, 20, 70, 'techno is the word');
	},
	display_init = function (canvas, options) {
		$.extend(opts, defaults, options);

		cvs = canvas;
		ctx = canvas.getContext('2d');
		container = $(cvs).parent();

		display_resized();
	},

	// ========================================
	print = function (msg) {
	};

	// ========================================
	return $.extend(module, {
		display_init: display_init,
		display_resized: display_resized,
		print: print
	});
}(TECHNO || {}, jQuery));
