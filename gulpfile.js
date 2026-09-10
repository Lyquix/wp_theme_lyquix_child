/**
 * gulpfile.js - Watch and automatically process CSS and JS
 *
 * @version     3.4.0
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

import gulp from 'gulp';
import fs from 'fs';
import path from 'path';
import mergeStream from 'merge-stream';
import * as sass from 'sass';
import tailwindcss from '@tailwindcss/postcss';
import postcssLib from 'postcss';
import livereload from 'gulp-livereload';
import postcss from 'gulp-postcss';
import cssnano from 'cssnano';
import autoprefixer from 'autoprefixer';
import sourcemaps from 'gulp-sourcemaps';
import rename from 'gulp-rename';
import terser from 'gulp-terser';

// Absolute paths required — tailwindcss uses jiti internally which resolves
// relative paths against its own package directory, not the project CWD
// Tailwind v4 is configured from CSS: the @import/@config/@source preamble lives in
// css/tailwind/entry.css and is prepended to the compiled Sass output, because Sass
// would otherwise try to resolve `@import "tailwindcss"` as a stylesheet of its own.
const tailwindEntryPath = 'css/tailwind/entry.css';
const tailwindEditorEntryPath = 'css/tailwind/editor.entry.css';

// CSS only honours @import at the very top of a stylesheet. Tailwind's generated output
// is prepended ahead of the compiled Sass, which pushes any font @import declared in SCSS
// below it — the browser then ignores it and the web fonts silently never load.
// Hoist plain-CSS @import rules back to the top, preserving order and dropping duplicates.
const hoistImports = (cssText) => {
	const charsets = [];
	const imports = [];
	const seen = new Set();

	// Match whole lines: a Google Fonts URL legitimately contains semicolons
	// (family=Inter:ital,wght@0,100..900;1,100..900), so stopping at the first one
	// would never match.
	const body = cssText.replace(/^[ \t]*@(charset|import)\b[^\n]*;[ \t]*$/gm, (match, kind) => {
		const rule = match.trim();
		if (seen.has(rule)) return '';
		seen.add(rule);
		(kind === 'charset' ? charsets : imports).push(rule);
		return '';
	});

	// @charset must precede everything, then @import, then the rest
	const head = charsets.slice(0, 1).concat(imports);
	return head.length ? head.join('\n') + '\n' + body : cssText;
};

// Compile SCSS and Tailwind CSS
// Uses multi-pass PostCSS to resolve chained theme() refs in theme.js
// (e.g. fontFamily.h1 → fontFamily.headings → fontFamily.base)
gulp.task('compile-css', async () => {
	// Sass JS API — no subprocess spawn
	let css;
	try {
		console.log('Compiling SCSS...');
		css = sass.compile('css/custom/custom.scss', { silenceDeprecations: ['global-builtin', 'import'] }).css;
		fs.writeFileSync('css/custom.css', css);
	} catch (err) {
		// A failed one-off build must not exit 0 with the previous styles still in place;
		// the exit code doesn't stop a running watcher
		console.error('SASS error:', err.message);
		process.exitCode = 1;
		return;
	}

	// Tailwind v4 resolves chained theme() references itself, so the previous
	// multi-pass PostCSS loop is no longer needed.
	try {
		const preamble = fs.readFileSync(tailwindEntryPath, 'utf8');
		const result = await postcssLib([tailwindcss(), autoprefixer()])
			.process(preamble + '\n' + css, { from: 'css/custom.css' });
		css = hoistImports(result.css);
	} catch (err) {
		console.error('Tailwind error:', err.message);
		process.exitCode = 1;
		return;
	}

	// Write non-minified for local dev (loaded when non_min_css = '1')
	fs.writeFileSync('css/styles.css', css);

	// Minify
	const minResult = await postcssLib([cssnano({ preset: 'default' })]).process(css, { from: undefined });
	fs.writeFileSync('css/styles.min.css', minResult.css);
	console.log('\x1b[41m\x1b[37m%s\x1b[0m', '  >>> PAGE RELOADED <<<  ');
	livereload.reload();

	// Editor CSS
	try {
		const editorPreamble = fs.readFileSync(tailwindEditorEntryPath, 'utf8');
		const editorCSS = fs.readFileSync('css/tailwind/editor.css', 'utf8').replace(/@tailwind\s+[a-z]+;/g, '');
		const editorResult = await postcssLib([tailwindcss(), autoprefixer()])
			.process(editorPreamble + '\n' + editorCSS, { from: 'css/tailwind/editor.css' });
		fs.writeFileSync('css/editor.css', hoistImports(editorResult.css));
	} catch (err) {
		console.error('Editor CSS error:', err.message);
		process.exitCode = 1;
	}
});

// Minify JS
gulp.task('vuejs', () => {
	console.log('Running vuejs minification...');
	return gulp.src('js/vue.js', { allowEmpty: true })
		.pipe(sourcemaps.init())
		.pipe(terser({ output: { comments: false } }))
		.pipe(rename({ suffix: '.min' }))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('js'));
});

// Compile Vue components: for each js/custom/vue/<app>.js, find matching component
// dirs in js/custom/components/ (dirs whose name starts with <app>), concatenate
// component JS + vue init file, then minify → js/<component>-components.min.js
gulp.task('compile-vue', () => {
	const vuePath = 'js/custom/vue';
	const componentsPath = 'js/custom/components';
	const outputPath = 'js';

	if (!fs.existsSync(vuePath)) {
		console.log(`No ${vuePath} directory — skipping Vue compilation`);
		return Promise.resolve();
	}

	const vueApps = fs.readdirSync(vuePath)
		.filter(f => f.endsWith('.js'))
		.map(f => ({ name: path.basename(f, '.js'), filePath: path.join(vuePath, f) }));

	const streams = [];

	for (const app of vueApps) {
		const componentDirs = fs.existsSync(componentsPath)
			? fs.readdirSync(componentsPath).filter(dir => dir.startsWith(app.name))
			: [];

		for (const componentDir of componentDirs) {
			const compDirPath = path.join(componentsPath, componentDir);
			const componentFiles = fs.readdirSync(compDirPath)
				.filter(f => f.endsWith('.js'))
				.sort()
				.map(f => path.join(compDirPath, f));

			const allFiles = [...componentFiles, app.filePath];
			const outputFile = path.join(outputPath, `${componentDir}-components.js`);
			const concatenated = allFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');
			fs.writeFileSync(outputFile, concatenated);
			console.log(`Compiled ${outputFile}`);

			const stream = gulp.src(outputFile)
				.pipe(sourcemaps.init())
				.pipe(terser({ output: { comments: false } }))
				.pipe(rename({ suffix: '.min' }))
				.pipe(sourcemaps.write('.'))
				.pipe(gulp.dest(outputPath))
				.on('end', () => livereload.reload());

			streams.push(stream);
		}
	}

	return streams.length ? mergeStream(...streams) : Promise.resolve();
});

// Livereload
gulp.task('livereload', () => {
	const lrServer = livereload.listen(35729);

	// tiny-lr writes to the websocket after a browser tab has gone away, which surfaces
	// as an unhandled EPIPE and kills the watch process. The disconnect is expected, so
	// swallow write errors from the livereload socket and keep watching.
	const ignoreSocketError = (err) => {
		if (err && ['EPIPE', 'ECONNRESET', 'ERR_STREAM_WRITE_AFTER_END'].includes(err.code)) return;
		console.error('LiveReload error:', err && err.message ? err.message : err);
	};
	if (lrServer && typeof lrServer.on === 'function') lrServer.on('error', ignoreSocketError);
	if (lrServer && lrServer.server && typeof lrServer.server.on === 'function') {
		lrServer.server.on('error', ignoreSocketError);
		lrServer.server.on('connection', (socket) => socket.on('error', ignoreSocketError));
	}
	process.on('uncaughtException', (err) => {
		if (err && ['EPIPE', 'ECONNRESET'].includes(err.code)) return ignoreSocketError(err);
		throw err;
	});

	// Watch SCSS/PHP/HTML and trigger CSS recompilation
	gulp.watch([
		'css/custom/**/*.scss',
		'../lyquix/page-templates/*.php',
		'page-templates/*.php',
		'../lyquix/php/**/*.php',
		'php/**/*.php',
		'custom.php',
		'tribe/**/*.php',
		'tribe-events/**/*.php',
		'css/tailwind/whitelist.html'
	], gulp.series('compile-css'));

	// bun outputs lyquix/scripts JS — just livereload on change
	gulp.watch(['js/lyquix.min.js', 'js/lyquix.js', 'js/scripts.min.js', 'js/scripts.js']).on('change', () => livereload.reload());

	gulp.watch(['js/vue.js']).on('change', () => {
		gulp.parallel('vuejs')(); // Minify vuejs
	});
	gulp.watch(['js/custom/components/**/*.js', 'js/custom/vue/**/*.js']).on('change', () => {
		gulp.series('compile-vue')(); // Recompile Vue component bundles
	});
});

// Default task
gulp.task('default', gulp.parallel('vuejs', 'compile-vue', 'compile-css', 'livereload'));


