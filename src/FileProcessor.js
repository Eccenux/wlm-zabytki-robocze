import fs from 'fs';
import { promisify } from 'util';

const readFileAsync = promisify(fs.readFile);

export default class FileProcessor {
	constructor(db) {
		this.db = db;
	}

	async processFiles(directoryPath) {
		const files = await this.readMatchingFiles(directoryPath);
		let total = 0;
		let skipped = 0;
		for (const file of files) {
			const items = await this.readJSONFromFile(directoryPath, file);
			console.log(`${file}: ${items.length}`);
			for (const item of items) {
				const result = await this.db.insert(item);
				if (result === false) {
					skipped++;
				} else {
					total++;
				}
			}
		}
		console.log(`Total items: ${total}, skipped: ${skipped}; in files: ${files.length}.`);
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