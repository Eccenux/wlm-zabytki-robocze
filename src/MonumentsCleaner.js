/**
 * Cleanup downloaded data.
 * 
 * Remove duplicate entries (same Q added twice, not location related).
 * Remove redirects.
 */
export class MonumentsCleaner {
	batchSize = 50;
	endpoint = 'https://www.wikidata.org/w/api.php';
	allRemoved = [];

	async cleanup(items, registerRemoved = false) {
		// first just remove duplicates
		let filteredItems = this.removeDuplicates(items);
		// then get items that actually exist in WikiData
		let allTitles = filteredItems.map(v=>v.item).filter(v=>typeof v === 'string');
		let filteredTitles = (await this.getExistingTitles(allTitles));
		if (registerRemoved) {
			const removedItems = filteredItems.filter(v => !filteredTitles.includes(v.item));
			if (removedItems.length) {
				// console.log('Removed items (redirects?):', JSON.stringify(removedItems));
				this.allRemoved.push(removedItems);
			}
		}
		// then only keep items that exists
		filteredItems = filteredItems.filter(v=>filteredTitles.includes(v.item));
		return filteredItems;
	}

	/**
	 * Given an array of page titles, returns titles that are not redirects and exist in DB.
	 * Uses MediaWiki API and fetches in batches of 50.
	 * @private
	 */
	async getExistingTitles(titles) {
		const batchSize = this.batchSize;
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

			let res = await fetch(`${this.endpoint}?${params.toString()}`);
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

	/**
	 * Use to sort by number in item id.
	 * @private
	 */
	compareQStrings(a, b) {
		const numA = parseInt(a.replace(/^Q/, ''), 10);
		const numB = parseInt(b.replace(/^Q/, ''), 10);
		return numA - numB;
	}
	/**
	 * Remove a subset of titles.
	 * @private
	 * @param {Array} allTitles All page titles ("Q123" being a page title too).
	 * @param {Array} filteredTitles Titles subset, titles to remove.
	 * @returns 
	 */
	getMissingTitles(allTitles, filteredTitles) {
		const filteredSet = new Set(filteredTitles);
		return allTitles.filter(title => !filteredSet.has(title));
	}
	/**
	 * @returns map of duplicate=>count.
	 * @private
	 */
	removeDuplicates(items) {
		const seen = new Set();
		const filtered = [];
		items.forEach(element => {
			const title = element.item;
			if (!seen.has(title)) {
				seen.add(title);
				filtered.push(element);
			}
		});
		return filtered;
	}
	/**
	 * @returns map of duplicate=>count.
	 * @private
	 */
	findDuplicates(titles) {
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
}
