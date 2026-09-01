/**
 * build-lyquix.ts — Bun build script for the lyquix library with child theme override support
 *
 * Usage (run from lyquix-child/):
 *   bun js/build-lyquix.ts           # single build
 *   bun js/build-lyquix.ts --watch   # watch mode
 *
 * Override mechanism:
 *   Drop any file from wp-content/themes/lyquix/js/lib/lyquix/ into
 *   wp-content/themes/lyquix-child/js/lib/lyquix/ and it will automatically
 *   be used instead of the parent version — no other changes needed.
 *
 *   Exception: core.ts is never overridden (it is a shared singleton;
 *   two copies would create two separate `vars`/`cfg` objects and break everything).
 *
 * @version     3.4.0
 * @package     wp_theme_lyquix_child
 * @author      Lyquix
 * @copyright   Copyright (C) 2015 - 2024 Lyquix
 * @license     GNU General Public License version 2 or later
 * @link        https://github.com/Lyquix/wp_theme_lyquix_child
 */

import { existsSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const jsDir = resolve(import.meta.dir);                        // lyquix-child/js/
const childLibDir = resolve(jsDir, 'lib/lyquix');             // lyquix-child/js/lib/lyquix/
const parentLibDir = resolve(jsDir, '../../lyquix/js/lib/lyquix'); // lyquix/js/lib/lyquix/
const isWatch = process.argv.includes('--watch');

/**
 * Bun build plugin: intercepts any import pointing at the parent theme's lib
 * and redirects it to the child override file when one exists.
 */
const overridePlugin = {
	name: 'child-theme-override',
	setup(build: any) {
		// Intercept absolute-style imports: ../../lyquix/js/lib/lyquix/<module>
		build.onResolve({ filter: /lyquix\/js\/lib\/lyquix\// }, (args: any) => {
			const match = (args.path as string).match(/lyquix\/js\/lib\/lyquix\/(.+)$/);
			if (!match) return;

			const moduleName = match[1];

			// Never redirect core — it must remain a singleton across the entire build
			if (moduleName === 'core') return;

			const childPath = resolve(childLibDir, moduleName + '.ts');
			if (existsSync(childPath)) {
				return { path: childPath };
			}
		});

		// Intercept relative imports (e.g. './util') inside parent lib modules
		build.onResolve({ filter: /^\.\/[^/]+$/ }, (args: any) => {
			if (!args.importer.includes('/lyquix/js/lib/lyquix/')) return;

			const moduleName = (args.path as string).replace('./', '');

			if (moduleName === 'core') return;

			const childPath = resolve(childLibDir, moduleName + '.ts');
			if (existsSync(childPath)) {
				return { path: childPath };
			}
		});
	}
};

async function build() {
	const start = Date.now();

	const [dev, min] = await Promise.all([
		Bun.build({
			entrypoints: [resolve(jsDir, 'lyquix.ts')],
			outfile: resolve(jsDir, 'lyquix.js'),
			target: 'browser',
			format: 'iife',
			sourcemap: 'inline',
			plugins: [overridePlugin],
		}),
		Bun.build({
			entrypoints: [resolve(jsDir, 'lyquix.ts')],
			outfile: resolve(jsDir, 'lyquix.min.js'),
			target: 'browser',
			format: 'iife',
			minify: true,
			sourcemap: 'inline',
			plugins: [overridePlugin],
		}),
	]);

	if (dev.success && min.success) {
		// Bun.build() may not write outfile to disk in all versions —
		// explicitly write each artifact to its intended path.
		const devPath = resolve(jsDir, 'lyquix.js');
		const minPath = resolve(jsDir, 'lyquix.min.js');
		writeFileSync(devPath, await dev.outputs[0].text());
		writeFileSync(minPath, await min.outputs[0].text());
		console.log(`[lyquix] built in ${Date.now() - start}ms`);
	} else {
		console.error('[lyquix] build failed:');
		[...dev.logs, ...min.logs].forEach(l => console.error(l));
	}
}

await build();

if (isWatch) {
	const { watch } = await import('fs');

	let debounce: ReturnType<typeof setTimeout> | null = null;

	const onChange = (_event: string, filename: string | null) => {
		if (!filename?.endsWith('.ts')) return;
		if (debounce) clearTimeout(debounce);
		debounce = setTimeout(async () => {
			console.log(`[lyquix] ${filename} changed — rebuilding...`);
			await build();
		}, 100);
	};

	// Watch child override directory and parent lib directory.
	// The child override dir is optional — only watch it if it exists.
	if (existsSync(childLibDir)) {
		watch(childLibDir, { recursive: false }, onChange);
	} else {
		console.log(`[lyquix] no child override directory (${childLibDir}) — skipping watch`);
	}
	if (existsSync(parentLibDir)) {
		watch(parentLibDir, { recursive: false }, onChange);
	} else {
		console.log(`[lyquix] no parent lib directory (${parentLibDir}) — skipping watch`);
	}

	// Watch lyquix.ts entry point
	watch(jsDir, { recursive: false }, (event, filename) => {
		if (filename === 'lyquix.ts') onChange(event, filename);
	});

	console.log('[lyquix] watching for changes...');
	// Keep process alive
	await new Promise(() => {});
}
