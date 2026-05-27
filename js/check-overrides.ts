/**
 * check-overrides.ts — Report status of child theme module overrides
 *
 * Usage (run from lyquix-child/):
 *   bun run check-overrides
 *
 * A file in js/lib/lyquix/ is an OVERRIDE if it contains real module code.
 * A file is a STUB if it only re-exports from the parent (single-line export).
 * For overrides, reports whether the parent module has changed since the
 * override was last updated (based on file modification times).
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { resolve } from 'path';

const overrideDir = resolve('js/lib/lyquix');
const parentDir = resolve('../../lyquix/js/lib/lyquix');

const files = readdirSync(overrideDir)
	.filter(f => f.endsWith('.ts'))
	.sort();

const STUB_RE = /^export \{ \w+ \} from '\.\.\/\.\.\/\.\.\/\.\.\/lyquix\/js\/lib\/lyquix\/\w+';\n?$/;

let overrideCount = 0;
let warnCount = 0;

console.log('\nChild theme module overrides — js/lib/lyquix/\n');
console.log('  Status    Module');
console.log('  --------  -------------------------');

for (const file of files) {
	const childPath = resolve(overrideDir, file);
	const parentPath = resolve(parentDir, file);
	const content = readFileSync(childPath, 'utf8');

	if (STUB_RE.test(content)) {
		// Pass-through stub — not an override, skip
		continue;
	}

	overrideCount++;
	const module = file.replace('.ts', '');

	let parentExists = false;
	try {
		statSync(parentPath);
		parentExists = true;
	} catch {
		// no parent equivalent — child-only module
	}

	if (!parentExists) {
		console.log(`  [CUSTOM]  ${module} — child-only (no parent equivalent)`);
		continue;
	}

	const childMtime = statSync(childPath).mtimeMs;
	const parentMtime = statSync(parentPath).mtimeMs;

	if (parentMtime > childMtime) {
		console.log(`  [WARN]    ${module} — parent updated after override was last saved`);
		warnCount++;
	} else {
		console.log(`  [OK]      ${module}`);
	}
}

if (overrideCount === 0) {
	console.log('  (no active overrides — all modules use parent stubs)');
}

console.log('');
if (warnCount > 0) {
	console.log(`⚠ ${warnCount} override(s) may be out of sync. Review parent changes and merge.`);
} else if (overrideCount > 0) {
	console.log(`✓ ${overrideCount} override(s) — all up to date.`);
}
console.log('');
