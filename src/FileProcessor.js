import fs from 'fs';
import { promisify } from 'util';
import { MonumentsCleaner } from './MonumentsCleaner.js';

const readFileAsync = promisify(fs.readFile);

export default class FileProcessor {
	constructor(db) {
		this.db = db;
	}

	async processFiles(directoryPath) {
		const files = await this.readMatchingFiles(directoryPath);
		let total = 0;
		let skipped = 0;
		let cleaner = new MonumentsCleaner();
		for (const file of files) {
			// raw / all
			const items = await this.readJSONFromFile(directoryPath, file);
			console.log(`${file}: ${items.length}`);

			// remove redirects and non-unique Q
			const clean = await cleaner.cleanup(items);
			if (items.length != clean.length) {
				let tempSkip = items.length - clean.length;
				console.log(`${file}: skipped with cleaner: ${tempSkip}`);
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
			console.log(`${file}: skipped with db.insert: ${tempSkip}`);
		}
		console.log(`Total items in DB: ${total}, skipped: ${skipped}; in files: ${files.length}.`);
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