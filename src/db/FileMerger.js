import fs from 'fs';
import path from 'path';

/**
 * A class for merging files.
 */
export default class FileMerger {
	/**
	 * Create a new FileMerger instance.
	 * @param {string} basePath The directory containing the files to be merged.
	 */
	constructor(basePath) {
		this.basePath = basePath;
	}

	/**
	 * Merge selected files into the specified output file.
	 * @param {string} outputFile The output file where the merged content will be saved.
	 * @param {function} filter A filter function to determine which files to merge.
	 */
	mergeFiles(outputFile, filter) {
		fs.readdir(this.basePath, (err, files) => {
			if (err) {
				console.error('Error reading directory:', err);
				return;
			}

			const selectedFiles = files.filter(filter);

			if (selectedFiles.length === 0) {
				console.log('No files matching the filter found in the directory.');
				return;
			}

			const outputStream = fs.createWriteStream(outputFile);

			selectedFiles.forEach((fileName) => {
				const filePath = path.join(this.basePath, fileName);
				const fileContent = fs.readFileSync(filePath, 'utf-8');
				outputStream.write(fileContent);
				outputStream.write('\n');
			});

			outputStream.end();
			console.log('Merged %d files.', selectedFiles.length);
		});
	}
}
