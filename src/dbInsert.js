/**
 * Insert WD data to local DB.
 */
import process from 'node:process';
import FileProcessor from "./FileProcessor.js";
import DbData from "./db/DbData.js";

try {
	const db = new DbData();
	// db.insert(data);

	// WARNING! Removes previous data (for one table)
	await db.createTable();

	// Define the directory where your JSON files are located
	const directoryPath = './output';

	const files = new FileProcessor(db);
	await files.processFiles(directoryPath);

} catch (error) {
	console.error(error);
	process.exit(500);
}
