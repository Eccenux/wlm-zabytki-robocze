import fs from 'fs';
import { promisify } from 'util';
import { MonumentsCleaner } from './MonumentsCleaner.js';

const readFileAsync = promisify(fs.readFile);

export default class FileProcessor {
	constructor(db) {
		this.db = db;
	}

	/** Main. */
	async processFiles(directoryPath, redirPath = './output/_redirs.json') {
		const files = await this.readMatchingFiles(directoryPath);
		let total = 0;
		let skipped = 0;
		let cleaner = new MonumentsCleaner();
		for (const file of files) {
			// raw / all
			const items = await this.readJSONFromFile(directoryPath, file);
			let info = `${file}: ${items.length}`;

			// remove redirects and non-unique Q
			const clean = await cleaner.cleanup(items, true);
			if (items.length != clean.length) {
				let tempSkip = items.length - clean.length;
				info += `; skipped cln: ${tempSkip}`;
				skipped += tempSkip;
			}

			// insert (might skip duoe to non-unique data)
			let tempSkip = 0;
			for (const item of clean) {
				const result = await this.db.insert(item);
				if (result === false) {
					skipped++;
					tempSkip++;
				} else {
					total++;
				}
			}
			if (tempSkip > 0) {
				info += `; skipped db: ${tempSkip}`;
			}
			console.log(info);
			let batchSize = items.length;
			if (Math.floor((total - batchSize) / 1000) !== Math.floor(total / 1000)) {
				console.log(`[INFO] Processed ${total} records; with ${cleaner.allRemoved.length} redirects.`);
			}
		}
		console.log(`Total items in DB: ${total}, skipped: ${skipped}; in files: ${files.length}.`);
		if (cleaner.allRemoved.length) {
			fs.writeFileSync(redirPath, JSON.stringify(cleaner.allRemoved, null, '\t'), 'utf8');
			console.log(`[INFO] Removed redirects (${cleaner.allRemoved.length}) saved to: ${redirPath}.`);
		}
	}

	/** (test) Check filtering without changing DB. */
	async processAndFindRedirs(directoryPath) {
		const files = await this.readMatchingFiles(directoryPath);
		let total = 0;
		let skipped = 0;
		let cleaner = new MonumentsCleaner();
		for (const file of files) {
			// raw / all
			const items = await this.readJSONFromFile(directoryPath, file);
			console.log(`${file}: ${items.length}`);

			// remove redirects and non-unique Q
			const clean = await cleaner.cleanup(items, true);
			if (items.length != clean.length) {
				let tempSkip = items.length - clean.length;
				skipped += tempSkip;
			}
			let batchSize = clean.length;
			total += batchSize;
			if (Math.floor((total - batchSize) / 1000) !== Math.floor(total / 1000)) {
				console.log(`Processed ${total} records and removed ${cleaner.allRemoved.length}.`);
			}
		}
		let removed = cleaner.allRemoved;
		console.log(`Total items in DB: ${total}, skipped: ${skipped}, redirs etc: ${removed.length}; in files: ${files.length}.`);
		fs.writeFileSync('./output/_redirs.json', JSON.stringify(removed, null, '\t'), 'utf8');
	}

	/** @private Read JSON files list. */
	async readMatchingFiles(directoryPath) {
		try {
			const files = await fs.promises.readdir(directoryPath);
			return files.filter(file => file.startsWith('lon_') && file.endsWith('.json'));
		} catch (error) {
			console.error(error);
		}
	}

	/** @private Read JSON array from file. */
	async readJSONFromFile(directoryPath, file) {
		try {
			const filePath = `${directoryPath}/${file}`;
			const data = await readFileAsync(filePath, 'utf8');
			const items = JSON.parse(data);
			if (!Array.isArray(items)) {
				throw `Not an array (${typeof items}) in ${file}`;
			}
			return items;
		} catch (error) {
			console.warn('Reading JSON failed for %s.', file, error);
			return [];
		}
	}
}