import fs from 'fs';
import path from 'path';

/**
 * Class for removing files matching a specified pattern in a directory.
 */
export default class FileRemover {
	/**
	 * Create a FileRemover instance.
	 */
	constructor() {
	}

	/**
	 * Remove files matching the specified pattern from the directory.
	 * 
	 * @param {string} directory The directory to search for files.
	 * @param {RegExp} pattern Regular expression pattern to match files.
	 */
	async removeFiles(directory, pattern) {
		try {
			let files = await this.readDirectory(directory, pattern);
			await this.unlinkFiles(directory, files);
		} catch (error) {
			console.error('Error:', error);
		}
	}

	/**
	 * Read the directory and return a list of files.
	 * 
	 * @param {string} directory The directory to search for files.
	 * @param {RegExp} pattern Regular expression pattern to match files.
	 * @returns {Promise<string[]>} A promise that resolves to an array of file names.
	 */
	async readDirectory(directory, pattern) {
		return new Promise((resolve, reject) => {
			fs.readdir(directory, (err, files) => {
				if (err) {
					reject(err);
				} else {
					resolve(files.filter(f => pattern.test(f)));
				}
			});
		});
	}

	/**
	 * Delete files that match the specified pattern.
	 * 
	 * @private
	 * @param {string} directory The directory to search for files.
	 * @param {string[]} files An array of file names to check and delete.
	 */
	async unlinkFiles(directory, files) {
		for (const file of files) {
			const filePath = path.join(directory, file);
			try {
				await this.unlinkFile(filePath);
				// console.log(`Deleted file: ${filePath}`);
			} catch (error) {
				console.error(`Error deleting file ${filePath}:`, error);
			}
		}
	}

	/**
	 * Unlink (delete) a file.
	 * 
	 * @private
	 * @param {string} filePath The path to the file to be deleted.
	 * @returns {Promise<void>} A promise that resolves when the file is successfully deleted.
	 */
	async unlinkFile(filePath) {
		return new Promise((resolve, reject) => {
			fs.unlink(filePath, (err) => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	}
}
