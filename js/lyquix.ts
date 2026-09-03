/**
 * lyquix.ts - Child theme entry point for lqx library
 *
 * Mirrors the parent lyquix.ts but imports the child theme's menu override.
 *
 * @version     3.4.0
 * @package     wp_theme_lyquix_child
 * @author      Lyquix
 * @copyright   Copyright (C) 2015 - 2024 Lyquix
 * @license     GNU General Public License version 2 or later
 * @link        https://github.com/Lyquix/wp_theme_lyquix_child
 */

// Import core functions and variables
import { vars, cfg, log, warn, error } from '../../lyquix/js/lib/lyquix/core';

// Import library modules (from parent theme)
import { a11y } from '../../lyquix/js/lib/lyquix/a11y';
import { analytics } from '../../lyquix/js/lib/lyquix/analytics';
import { detect } from '../../lyquix/js/lib/lyquix/detect';
import { geolocate } from '../../lyquix/js/lib/lyquix/geolocate';
import { lyqbox } from '../../lyquix/js/lib/lyquix/lyqbox';
import { mutation } from '../../lyquix/js/lib/lyquix/mutation';
import { store } from '../../lyquix/js/lib/lyquix/store';
import { swipe } from '../../lyquix/js/lib/lyquix/swipe';
import { responsive } from '../../lyquix/js/lib/lyquix/responsive';
import { theme } from '../../lyquix/js/lib/lyquix/theme';
import { util } from '../../lyquix/js/lib/lyquix/util';
import { video } from '../../lyquix/js/lib/lyquix/video';
import { menu } from '../../lyquix/js/lib/lyquix/menu';

// Import functionality for Gutenberg blocks and modules (from parent theme)
import { accordion } from '../../lyquix/js/lib/lyquix/accordion';
import { alerts } from '../../lyquix/js/lib/lyquix/alerts';
import { cards } from '../../lyquix/js/lib/lyquix/cards';
import { filters } from '../../lyquix/js/lib/lyquix/filters';
import { gallery } from '../../lyquix/js/lib/lyquix/gallery';
import { leavingSiteAlert } from '../../lyquix/js/lib/lyquix/leaving-site-alert';
import { map } from '../../lyquix/js/lib/lyquix/map';
import { modal } from '../../lyquix/js/lib/lyquix/modal';
import { popup } from '../../lyquix/js/lib/lyquix/popup';
import { tabs } from '../../lyquix/js/lib/lyquix/tabs';
import { slider } from '../../lyquix/js/lib/lyquix/slider';
import { testimonial } from '../../lyquix/js/lib/lyquix/testimonial';

declare const lqx;

const version = '3.4.0';

// Initialize library
const init = (customCfg) => {
	// Run only once
	if (vars.init) return;

	// Extend default config with custom config
	if (typeof customCfg !== 'object') customCfg = {};

	const mods = [ // Order of initialization is important
		'mutation',
		'store',
		'util',
		'detect',
		'responsive',
		'analytics',
		'geolocate',
		'swipe',
		'lyqbox',
		'theme',
		'menu',
		'video',
		// Gutenberg blocks
		'accordion',
		'alerts',
		'cards',
		'filters',
		'gallery',
		'leavingSiteAlert',
		'map',
		'modal',
		'popup',
		'tabs',
		'slider',
		'testimonial',
		// Accessibility fixes run last, after all widgets have initialized
		'a11y'
	];

	// Initialize core config
	Object.keys(cfg).forEach((k) => {
		if (k in customCfg) cfg[k] = customCfg[k];
	});

	// Initialize modules and pass extended config
	mods.forEach((mod) => {
		lqx[mod].init(mod in customCfg ? customCfg[mod] : {});
	});

	// Trigger lqxready event
	vars.document.trigger('lqxready');
	log('lqxready Event');

	// Run only once
	vars.init = true;
};

// A ready utility function that works like jQuery(document).ready()
const ready = (callback) => {
	if (vars.init === true) {
		callback();
	} else {
		vars.document.on('lqxready', callback);
	}
};

const expObj = Object.defineProperties({
	init,
	ready,
	log,
	warn,
	error,
	/* JS Modules */
	a11y,
	analytics,
	detect,
	geolocate,
	lyqbox,
	mutation,
	responsive,
	store,
	swipe,
	util,
	theme,
	menu,
	video,
	/* Gutenberg blocks */
	accordion,
	alerts,
	cards,
	filters,
	gallery,
	leavingSiteAlert,
	map,
	modal,
	popup,
	tabs,
	slider,
	testimonial
}, {
	// Set the cfg and vars properties as read-only
	cfg: {
		get() {
			return cfg;
		},
		set() {
			return undefined;
		}
	},
	vars: {
		get() {
			return vars;
		},
		set() {
			return undefined;
		}
	},
	version: {
		get() {
			return version;
		},
		set() {
			return undefined;
		}
	}
});

export default expObj;

// Manually assign the exported object to the global variable 'lqx'
if (typeof window !== 'undefined') {
	(window as any).lqx = expObj;
}

// Trigger lqxload event
vars.document.trigger('lqxload');
log('lqxload Event');
