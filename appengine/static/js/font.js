/*jslint bitwise: true, regexp: true, sloppy: false, sub: false, vars: false, plusplus: true, maxerr: 50, indent: 4 */
/*global FONT, jQuery */
"use strict";

/*
  FONT methods require a configuration structure (cfg) with the following members:

  width:		width of full glyph
  space:		width of empty glyph (space)
  step:			gap between characters

  bothigh:		height of glyph bottom half
  tophigh:		height of glyph top half
  sidethick:	width of glyph side strokes
  botthick:		height of glyph bottom stroke
  midthick:		height of glyph middle stroke
  topthick:		height of glyph top stroke

  rect:			function taking (x, y, w, h) parameters of each glyph stroke
*/

var FONT = (function (module, $) {
	var glyphs = {
		'~': '~',
		'<': '<',
		'>': '>',
		'{': '{',
		',': ',',
		'.': '.',
		'!': '!.',
		'=': '=',
		'+': '+',
		'-': "-",
		';': ';',
		'"': '"',
		"'": "'",
		'|': '|',
		':': ':',
		'%': '%',
		'*': '*',
		'€': '€',
// $
// £
// @
// ^
// (
// )
// _
// [
// ]
// \
// /
// ?

		a: "Oh-",
		b: "Ru-",
		c: "El",
		d: "Du",
		e: "Ol>",
		f: "Ep-",
		g: "Eu{",
		h: "Hh-",
		i: "Ti",
		j: "Jy",
		k: 'Kh-',
		l: "Ll",
		m: "Mh",
		n: "Oh",
		o: "Ou",
		p: "Op>",
		q: "Ouq",
		r: "Rh-",
		s: "Ey<",
		t: "T;",
		u: "Hu",
		v: "Hv",
		w: "Hw",
		x: "X",
		y: "Hy<",
		z: "Zz-",

		'0': 'Ou0',
		'1': "1|",
		'2': 'Zl>',
		'3': 'Zy>',
		'4': '4',
		'5': 'Ey<',
		'6': 'Eu-',
		'7': '7',
		'8': 'Ou-',
		'9': 'Oy<'
	},
	measure = function (cfg, text) {
		var sum = 0, l = text.length, i = 0;
		while (i < l) {
			sum += (text[i] === ' ' ? cfg.space : cfg.width + (l - i > 1 ? cfg.step : 0));
			++i;
		}
		return sum;
	},
	renderCode = function (cfg, x, y, code) {
		var topy = y - cfg.bothigh - cfg.tophigh,
		topyin = topy + cfg.topthick,
		midy = y - cfg.bothigh,
		rx = x + cfg.width,
		mx = x + (cfg.width - cfg.sidethick) >> 1,
		sth = cfg.sidethick,
		tth = cfg.topthick,
		thin = cfg.tophigh - tth,
		mth = cfg.midthick,
		bth = cfg.botthick,
		bhin = cfg.bothigh - bth,
		k, l, j;

		switch (code) {
		case '-':
			cfg.rect(x + sth, midy, cfg.width - (2 * sth), mth);
			break;
		case '=':
			cfg.rect(x + sth, midy - mth, cfg.width - (2 * sth), mth);
			cfg.rect(x + sth, midy + mth, cfg.width - (2 * sth), mth);
			break;
		case '+':
			cfg.rect(x + sth, midy, cfg.width - (2 * sth), mth);
			cfg.rect(mx, midy - thin, sth, thin);
			cfg.rect(mx, midy + mth, sth, thin);
			break;
		case '<':
			cfg.rect(x, midy, cfg.width - sth, mth);
			break;
		case '>':
			cfg.rect(x + sth, midy, cfg.width - sth, mth);
			break;
		case '{':
			cfg.rect(rx - (sth * 2), midy, sth, mth);
			break;
		case ':':
			cfg.rect(mx - sth, midy - mth, sth, mth);
			cfg.rect(mx - sth, midy + mth, sth, mth);
			break;
		case ';':
			cfg.rect(mx, midy, sth, cfg.bothigh);
			break;
		case ',':
			cfg.rect(mx - sth, y - bth, sth, bth);
			cfg.rect(mx, y - (bth * 2), sth, bth);
			break;
		case '.':
			cfg.rect(mx, y - bth, sth, bth);
			break;
		case '!':
			cfg.rect(mx, topy, sth, bhin + mth);
			break;
		case '"':
			cfg.rect(mx - sth, topy, sth, tth * 2);
			cfg.rect(mx + sth, topy, sth, tth * 2);
			break;
		case "'":
			cfg.rect(mx, topy, sth, tth * 2);
			break;
		case "|":
			cfg.rect(mx, topy, sth, cfg.bothigh + cfg.tophigh);
			break;
		// ----------------------------------------
		case "0":
			cfg.rect(mx, midy, sth, mth);
			break;
		case "1":
			cfg.rect(mx - sth, topy + tth, sth, tth);
			break;
		case "4":
			cfg.rect(rx - sth, topy, -sth, cfg.bothigh + cfg.tophigh);
			cfg.rect(rx, midy, -sth, mth);
			k = sth << 1;
			cfg.rect(x, midy, cfg.width - k, mth);
			cfg.rect(x, topy, sth, cfg.tophigh);
			break;
		case "7":
			cfg.rect(x, topy, cfg.width, tth);
			cfg.rect(rx, topyin, -sth, cfg.tophigh - tth);
			cfg.rect(mx, midy + mth, sth, cfg.bothigh - mth);
			k = (cfg.width - sth) >> 1;
			cfg.rect(mx + sth, midy, k - sth, mth);
			break;
		// ----------------------------------------
		case 'D':
			k = sth >> 1;
			l = tth >> 1;
			cfg.rect(x, topyin, sth, thin);
			cfg.rect(x, topy, cfg.width - sth, tth);
			cfg.rect(rx, topyin, -sth, thin);
			break;
		case 'E':
			cfg.rect(x, topyin, sth, thin);
			cfg.rect(x, topy, cfg.width, tth);
			break;
		case 'H':
			cfg.rect(x, topy, sth, cfg.tophigh);
			cfg.rect(rx, topy, -sth, cfg.tophigh);
			break;
		case 'J':
			cfg.rect(rx, topy, -sth, cfg.tophigh);
			cfg.rect(rx - sth, topy, -sth, tth);
			break;
		case 'K':
			cfg.rect(x, topy, sth, cfg.tophigh);
			cfg.rect(rx - sth, topy, -sth, cfg.tophigh);
			break;
		case 'L':
			cfg.rect(x, topy, sth, cfg.tophigh);
			break;
		case 'M':
			cfg.rect(x, topy, cfg.width, tth);
			cfg.rect(x, topy, sth, cfg.tophigh);
			cfg.rect(rx, topy, -sth, cfg.tophigh);
			cfg.rect(mx, topyin, sth, thin + mth);
			break;
		case 'O':
			cfg.rect(x, topy, cfg.width, tth);
			cfg.rect(x, topyin, sth, thin);
			cfg.rect(rx, topyin, -sth, thin);
			break;
		case 'R':
			cfg.rect(x, topyin, sth, thin);
			cfg.rect(x, topy, cfg.width - sth, tth);
			cfg.rect(rx - sth, topyin, -sth, thin);
			break;
		case 'T':
			cfg.rect(x, topy, cfg.width, tth);
			cfg.rect(mx, topyin, sth, thin);
			break;
		case 'X':
			cfg.rect(mx - (sth >> 1), midy, sth * 2, mth);
			j = midy;
			mx = x + (cfg.width >> 1);
			k = 0;
			l = sth + (sth >> 1);
			while (--j >= topy & mx - k - l >= x) {
				cfg.rect(mx - k, j, -l, 1);
				cfg.rect(mx + k, j, l, 1);
				++k;
			}
			if (j >= topy) {
				cfg.rect(x, topy, sth, 1 + topy - j);
				cfg.rect(rx, topy, -sth, 1 + topy - j);
			}
			j = midy + mth - 1;
			k = 0;
			while (++j <= y & mx - k - l >= x) {
				cfg.rect(mx - k, j, -l, 1);
				cfg.rect(mx + k, j, l, 1);
				++k;
			}
			if (j <= y) {
				cfg.rect(x, y, sth, j - y);
				cfg.rect(rx, y, -sth, j - y);
			}
			break;
		case 'Z':
			cfg.rect(x, topy, cfg.width, tth);
			cfg.rect(rx, topyin, -sth, thin);
			break;
		// ----------------------------------------
		case 'h':
			cfg.rect(x, midy, sth, cfg.bothigh);
			cfg.rect(rx, midy, -sth, cfg.bothigh);
			break;
		case 'i':
			cfg.rect(x, y, cfg.width, -bth);
			cfg.rect(mx, midy, sth, bhin);
			break;
		case 'l':
			cfg.rect(x, y, cfg.width, -bth);
			cfg.rect(x, midy, sth, bhin);
			break;
		case 'p':
			cfg.rect(x, midy, sth, cfg.bothigh);
			break;
		case 'q':
			cfg.rect(rx - (sth * 3), y - (bth * 2), sth, bth);
			break;
		case 'u':
			cfg.rect(x, y, cfg.width, -bth);
			cfg.rect(x, midy, sth, bhin);
			cfg.rect(rx, midy, -sth, bhin);
			break;
		case 'v':
			y = midy + cfg.bothigh;
			mx = x + (cfg.width / 2);
			k = 1;
			while (--y >= midy && k <= cfg.width && k <= sth * 3) {
				cfg.rect(mx - (k / 2), y, k, 1);
				k += 2;
			}
			k = 1;
			l = sth + (sth >> 1);
			while (y >= midy && mx - k - l >= x) {
				cfg.rect(mx - k, y, -l, 1);
				cfg.rect(mx + k, y, l, 1);
				++k;
				--y;
			}
			if (++y - midy > 0) {
				cfg.rect(x, midy, sth, y - midy);
				cfg.rect(rx, midy, -sth, y - midy);
			}
			break;
		case 'w':
			cfg.rect(x, y, cfg.width, -bth);
			cfg.rect(x, midy, sth, bhin);
			cfg.rect(rx, midy, -sth, bhin);
			cfg.rect(mx, midy, sth, bhin);
			break;
		case 'y':
			cfg.rect(x, y, cfg.width, -bth);
			cfg.rect(rx, midy, -sth, bhin);
			break;
		case 'z':
			cfg.rect(x, y, cfg.width, -bth);
			cfg.rect(x, midy + mth, sth, bhin - mth);
			break;
		// ----------------------------------------
		// Full block.
		case '%':
			cfg.rect(x, y, cfg.width, -cfg.bothigh - cfg.tophigh);
			return;
		// Small central block.
		case '*':
			cfg.rect(x + (sth << 1), topyin + cfg.topthick,
					 cfg.width - (sth << 2),
					 cfg.tophigh + cfg.bothigh - ((cfg.topthick + cfg.botthick) << 1));
			return;
		// Tiny central block of width & height set by mid thickness.
		case '€':
			cfg.rect(mx, midy, mth, mth);
			return;
		// ----------------------------------------
		// Square inset block, shown for unrecognised characters.
		case '~':
			cfg.rect(x + sth, topyin, cfg.width - (2 * sth),
					 cfg.tophigh + cfg.bothigh - cfg.topthick - cfg.botthick);
			break;
		default:
//			console.warn('Unknown glyph code ' + code);
			break;
		}
	},
	render = function (cfg, x, y, text) {
		var l = text.length, i = 0, kar,
		kode, ki, kl;
		while (i < l) {
			kar = text[i++];
			if (kar === ' ') {
				x += cfg.space;
			} else {
				kode = glyphs[kar] || '~';
				for (ki = 0, kl = kode.length; ki < kl; ++ki) {
					renderCode(cfg, x, y, kode[ki]);
				}
				x += cfg.width + (l - i > 0 ? cfg.step : 0);
			}
		}
		return x;
	},
	renderCentred = function (cfg, x, y, text) {
		var w = measure(cfg, text);
		render(cfg, x - (w / 2), y, text);
	},
	capture = function (cfg, x, y, text, centred) {
		var r = [],
		rc = cfg.rect;
		cfg.rect = function (x, y, w, h) {
			r.push(x, y, w, h);
		}
		if (centred) {
			renderCentred(cfg, x, y, text);
		} else {
			render(cfg, x, y, text);
		}
		cfg.rect = rc;
		return function (x, y, fn, self, i, l) {
			for (i = 0, l = r.length - 3; i < l;) {
				fn.call(self, x + r[i++], y + r[i++], r[i++], r[i++]);
			}
		};
	};

	// ========================================
	return $.extend(module, {
		measure: measure,
		render: render,
		renderCentred: renderCentred,
		capture: capture
	});
}(FONT || {}, jQuery));
