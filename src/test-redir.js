/**
 * Test filtring out redirects from JSON.
 */

import fs from 'fs';
import { MonumentsCleaner } from './MonumentsCleaner.js';

/**
 * Given an array of page titles, returns titles that are not redirects.
 * Uses MediaWiki API and fetches in batches of 50.
 */
async function getNonRedirectTitles(titles) {
	const endpoint = 'https://www.wikidata.org/w/api.php';
	const batchSize = 50;
	let nonRedirects = [];

	for (let i = 0; i < titles.length; i += batchSize) {
		let batch = titles.slice(i, i + batchSize);
		let params = new URLSearchParams({
			action: 'query',
			format: 'json',
			prop: 'info',
			titles: batch.join('|'),
			redirects: '', // optional: resolves redirects if needed
			origin: '*'
		});

		let res = await fetch(`${endpoint}?${params.toString()}`);
		let data = await res.json();

		let pages = data?.query?.pages;
		if (pages) {
			for (const pageId in pages) {
				const page = pages[pageId];
				if (!('redirect' in page)) {
					nonRedirects.push(page.title);
				} else {
					// this probably never happens (seems like redirect is already resolved)
					console.warn('page was a redirect', JSON.stringify({t:page.title, page}));
				}
			}
		}
	}

	return nonRedirects;
}

function compareQStrings(a, b) {
	const numA = parseInt(a.replace(/^Q/, ''), 10);
	const numB = parseInt(b.replace(/^Q/, ''), 10);
	return numA - numB;
}
function getMissingTitles(allTitles, filteredTitles) {
	const filteredSet = new Set(filteredTitles);
	return allTitles.filter(title => !filteredSet.has(title));
}
/**
 * Returns map of duplicate=>count.
 */
function findDuplicates(titles) {
	const seen = new Set();
	const duplicates = new Map();

	for (const title of titles) {
		if (seen.has(title)) {
			duplicates.set(title, (duplicates.get(title) || 0) + 1);
		} else {
			seen.add(title);
		}
	}

	return duplicates;
}
let dumpStringMap = (dupes) => Array.from(dupes.entries()).map(e=>e.join(': ')).join(', ');

//
// Super mini example usage
let titles = [
	'Q121884648', // Przekierowano do Q4801376
	'Q4801376',
	'Q66194621',
];
// getNonRedirectTitles(titles).then(console.log);

//
// JSON example usage
// large, real data
let outpath, path, expectedCount;
path = './output/test/lon_170300_170450.json';
expectedCount = 736;
// mini, partially forged
path = './output/test/lon_mini.json';
outpath = './output/test/lon_mini_clear.json';
expectedCount = 8;

// initial PoC
var check = async function (path, expectedCount) {
	let cutForDisplay = 15;
	// Read and parse the JSON file into an array
	let data = JSON.parse(fs.readFileSync(path, 'utf8'));
	if (!Array.isArray(data)) {
		console.error('invalid json data');
	}
	console.assert(expectedCount == data.length, `expected items: ${expectedCount} == ${data.length}`);
	titles = data.map(v=>v.item).filter(v=>typeof v === 'string').sort(compareQStrings);
	console.assert(expectedCount == titles.length, `expected titles: ${expectedCount} == ${titles.length}`);
	let filteredTitles = (await getNonRedirectTitles(titles)).sort(compareQStrings);
	console.log(`input: [${titles.length}] ${titles.slice(0, cutForDisplay)}`);
	console.log(`output: [${filteredTitles.length}] ${filteredTitles.slice(0, cutForDisplay)}`);
	
	let missing = getMissingTitles(titles, filteredTitles);
	console.log(`missing: [${missing.length}] ${missing.slice(0, cutForDisplay)}`);
	
	const dupes = findDuplicates(titles);
	console.log(`dupes: [${dupes.size}] ${dumpStringMap(dupes)}`);		
}
// check(path, expectedCount);

// cleaner class test
check = async function (path, outpath, expectedCount) {
	let data = JSON.parse(fs.readFileSync(path, 'utf8'));
	if (!Array.isArray(data)) {
		console.error('invalid json data');
	}
	console.assert(expectedCount == data.length, `expected items: ${expectedCount} == ${data.length}`);

	let cleaner = new MonumentsCleaner();
	let clean = await cleaner.cleanup(data);
	fs.writeFileSync(outpath, JSON.stringify(clean, null, '\t'), 'utf8');

	let show = (data) => '\n' + data.map(v=>[v.item, v.itemLabel].join(':')).join(',\n');
	console.log(`input: [${data.length}] ${show(data)}`);
	console.log(`output: [${clean.length}] ${show(clean)}`);
}
check(path, outpath, expectedCount);
