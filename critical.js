/**
 * critical.js - Generate Critical Path CSS
 *
 * @version     3.4.0
 * @package     wp_theme_lyquix_child
 * @author      Lyquix
 * @copyright   Copyright (C) 2015 - 2024 Lyquix
 * @license     GNU General Public License version 2 or later
 * @link        https://github.com/Lyquix/wp_theme_lyquix_child
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

import fs from 'fs';
import { createRequire } from 'module';
import readline from 'readline';
import { generate } from 'critical';

// The PostCSS that critical itself is built on
const postcss = createRequire(import.meta.resolve('critical'))('postcss');

// Swiper 14 ships native CSS nesting, and critical flattens nested rules into top-level
// selectors starting with "&". Browsers resolve a top-level "&" to the root element, so
// "&:only-child { display: none !important }" hides the whole page. Rules still nested
// inside a parent rule are valid and kept.
const dropFlattenedNesting = (css) => {
	const root = postcss.parse(css);
	root.walkRules((rule) => {
		for (let parent = rule.parent; parent; parent = parent.parent) if (parent.type === 'rule') return;
		if (!rule.selector.includes('&')) return;
		const selectors = rule.selectors.filter((selector) => !selector.includes('&'));
		if (selectors.length) rule.selectors = selectors;
		else rule.remove();
	});
	return root.toString();
};

const CONFIG_FILE = './critical.json';
const OUTPUT_DIR = './css/critical';

// A browser that fails to launch can reject again after the page that triggered it has
// already been reported. Count it as a failure instead of letting it end the whole run.
process.on('unhandledRejection', (reason) => {
	console.error('Unhandled error:', reason && reason.message ? reason.message.split('\n')[0] : reason);
	process.exitCode = 1;
});

const USAGE = `Generate critical path CSS for every template the site reports.

  node critical.js                            prompt for the site URL (saved to critical.json)
  node critical.js --yes                      reuse the URL saved in critical.json without asking
  node critical.js --url=https://site.test    one-off run against another URL; critical.json is not touched

Options:
  --url=<url>      site to generate from
  --user=<name>    HTTP basic auth user
  --pass=<pass>    HTTP basic auth password
  --only=<text>    only regenerate templates whose URL contains <text>
  --insecure       accept self-signed certificates (automatic for .test, .local and localhost)
  --yes, -y        use the saved configuration without asking

Flush the site's page cache first: a cached page still carries its old critical CSS.`;

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name) => {
	const hit = args.find((arg) => arg.startsWith(`--${name}=`));
	return hit ? hit.slice(name.length + 3) : null;
};

// Prompts are only needed for interactive runs; creating the interface lazily lets a
// non-interactive run exit as soon as it is done
let rl = null;
const ask = (question) => new Promise((resolve) => {
	if (!rl) rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	rl.question(question, (answer) => resolve(answer.trim()));
});

function isValidURL(string) {
	try {
		new URL(string);
		return true;
	} catch (_) {
		return false;
	}
}

// Local development hosts can't have publicly trusted certificates
const isLocalHost = (url) => /(^localhost$|\.test$|\.local$)/.test(new URL(url).hostname);

const authHeaders = ({ username, password }) => (username || password)
	? { Authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64') }
	: {};

// Must match get_critical_css() in the parent theme's php/css.php, which replaces every
// slash in the page path: a page two levels down is page-parent---child---page.css
const outputPath = (template) => `${OUTPUT_DIR}/${template.type}`
	+ (template.type === 'page' ? '-' + template.slug.split('/').join('---') : '')
	+ '.css';

async function getConfig() {
	const url = option('url');
	if (url) {
		if (!isValidURL(url)) throw new Error(`Invalid --url: ${url}`);
		return { baseUrl: url, credentials: { username: option('user') || '', password: option('pass') || '' } };
	}

	const saved = fs.existsSync(CONFIG_FILE) ? JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) : null;

	if (flag('yes') || args.includes('-y')) {
		if (!saved) throw new Error(`--yes was given but ${CONFIG_FILE} does not exist; pass --url instead`);
		return saved;
	}

	if (saved && (await ask(`Use saved configuration? (URL: ${saved.baseUrl}) (y/n): `)).toLowerCase() === 'y') return saved;

	let baseUrl = await ask('Please enter the URL of the website: ');
	while (!isValidURL(baseUrl)) {
		console.log('Invalid URL. Please try again.');
		baseUrl = await ask('Please enter the URL of the website: ');
	}
	const credentials = {
		username: await ask('Enter HTTP username (optional): '),
		password: await ask('Enter HTTP password (optional): ')
	};

	const config = { baseUrl, credentials };
	fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
	return config;
}

async function fetchCriticalCssCfg(baseUrl, credentials) {
	const url = new URL('/wp-json/lyquix/v3/critical', baseUrl);
	const response = await fetch(url, { headers: authHeaders(credentials) });

	if (response.status === 429) {
		throw new Error(`${url} is rate limited; try again in ${response.headers.get('retry-after') || 60}s`);
	}
	if (!response.ok) {
		throw new Error(`${url} returned HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
	}

	return response.json();
}

async function criticalCSS(criticalCssCfg, config, insecure) {
	fs.mkdirSync(OUTPUT_DIR, { recursive: true });

	const only = option('only');
	const templates = only ? criticalCssCfg.templates.filter((t) => t.url.includes(only)) : criticalCssCfg.templates;
	const failed = [];

	for (let i = 0; i < templates.length; i++) {
		const template = templates[i];
		const file = outputPath(template);
		const started = Date.now();

		// Delete the old file before the page is requested: while it exists the theme inlines
		// it and defers the full stylesheets, which is not the page we want to extract from
		if (fs.existsSync(file)) fs.unlinkSync(file);

		const options = {
			inline: false,
			src: `${template.url}${template.url.includes('?') ? '&' : '?'}no-critical-path-css`,
			dimensions: criticalCssCfg.viewports,
			ignoreInlinedStyles: true,
			penthouse: {
				blockJSRequests: false
			}
		};

		if (config.credentials.username || config.credentials.password) {
			options.user = config.credentials.username;
			options.pass = config.credentials.password;
		}

		if (insecure) options.request = { https: { rejectUnauthorized: false } };

		try {
			const output = await generate(options);
			// Normalize relative wp-content paths to site-root-absolute so the inlined <style>
			// block resolves correctly from any page depth, including language-prefixed URLs
			// like /ru/ or /zh/.
			const css = dropFlattenedNesting(output.css).replace(/url\((\.\.\/)*wp-content\//g, 'url(/wp-content/');
			fs.writeFileSync(file, css);
			console.log(`${i + 1}/${templates.length} (${(Date.now() - started) / 1000}s): ${template.url}`);
		} catch (error) {
			// One broken page shouldn't cost the rest of the run
			failed.push(template.url);
			console.error(`${i + 1}/${templates.length} FAILED: ${template.url} (${error.message})`);
		}
	}

	return failed;
}

async function main() {
	if (flag('help') || args.includes('-h')) {
		console.log(USAGE);
		return;
	}

	const startTime = Date.now();

	try {
		const config = await getConfig();

		const insecure = flag('insecure') || isLocalHost(config.baseUrl);
		if (insecure) process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

		const criticalCssCfg = await fetchCriticalCssCfg(config.baseUrl, config.credentials);
		const failed = await criticalCSS(criticalCssCfg, config, insecure);

		console.log(`Finished in ${(Date.now() - startTime) / 1000}s: ${failed.length ? `${failed.length} failed` : 'all templates generated'}`);
		if (failed.length) process.exitCode = 1;
	} catch (error) {
		console.error('An error occurred:', error.message);
		process.exitCode = 1;
	} finally {
		if (rl) rl.close();
	}
}

main();
