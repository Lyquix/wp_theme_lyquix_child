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
import sass from 'sass';
import tailwindcss from 'tailwindcss';
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
const tailwindConfigPath = path.resolve('css/tailwind/config.js');
const tailwindEditorConfigPath = path.resolve('css/tailwind/editor.config.js');

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
		console.error('SASS error:', err.message);
		return;
	}

	// Multi-pass Tailwind: each pass may produce new theme() calls from chained
	// theme() refs in theme.js values (e.g. 'headings': 'theme("fontFamily.base")')
	const themeRegex = /theme\s*\(\s*['"][^'"]+['"]\s*\)/;
	for (let i = 0; i < 5; i++) {
		const result = await postcssLib([tailwindcss(tailwindConfigPath), autoprefixer()]).process(css, { from: 'css/custom.css' });
		css = result.css;
		if (!themeRegex.test(css)) break;
		console.log(`Resolving nested theme() refs (pass ${i + 2})...`);
	}

	// Write non-minified for local dev (loaded when non_min_css = '1')
	fs.writeFileSync('css/styles.css', css);

	// Minify
	const minResult = await postcssLib([cssnano({ preset: 'default' })]).process(css, { from: undefined });
	fs.writeFileSync('css/styles.min.css', minResult.css);
	console.log('\x1b[41m\x1b[37m%s\x1b[0m', '  >>> PAGE RELOADED <<<  ');
	livereload.reload();

	// Editor CSS (single pass — no chained theme() refs expected)
	try {
		const editorCSS = fs.readFileSync('css/tailwind/editor.css', 'utf8');
		const editorResult = await postcssLib([tailwindcss(tailwindEditorConfigPath), autoprefixer()]).process(editorCSS, { from: 'css/tailwind/editor.css' });
		fs.writeFileSync('css/editor.css', editorResult.css);
	} catch (err) {
		console.error('Editor CSS error:', err.message);
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
	livereload.listen(35729);

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


