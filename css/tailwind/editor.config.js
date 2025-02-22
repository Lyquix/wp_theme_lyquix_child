/** @type {import('tailwindcss').Config} */

/**
 * editor.config.js - Tailwind CSS configuration for the editor compiler
 *
 * @version     3.1.0
 * @package     wp_theme_lyquix
 * @author      Lyquix
 * @copyright   Copyright (C) 2015 - 2024 Lyquix
 * @license     GNU General Public License version 2 or later
 * @link        https://github.com/Lyquix/wp_theme_lyquix
 */

//    .d8888b. 88888888888 .d88888b.  8888888b.   888
//   d88P  Y88b    888    d88P" "Y88b 888   Y88b  888
//   Y88b.         888    888     888 888    888  888
//    "Y888b.      888    888     888 888   d88P  888
//       "Y88b.    888    888     888 8888888P"   888
//         "888    888    888     888 888         Y8P
//   Y88b  d88P    888    Y88b. .d88P 888          "
//    "Y8888P"     888     "Y88888P"  888         888
//
//  DO NOT MODIFY THIS FILE!

const { tailwindLayouts, defaultOptions } = require('tailwind-layouts');

// Export Tailwind CSS configuration
module.exports = {
	presets: [require('./presets.js')],
	content: ['./css/tailwind/whitelist.html'],
	theme: require('./theme.js'),
	corePlugins: {
		// Disable Preflight base styles in CSS targeting the editor.
		preflight: false,
	},
	plugins: [
		require('@tailwindcss/aspect-ratio'),
		require('@tailwindcss/container-queries'),
		tailwindLayouts({
			...defaultOptions,
			useGlobalMeasure: false,
		}),
	],
};
