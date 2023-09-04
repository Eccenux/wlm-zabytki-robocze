import FileProcessor from "./FileProcessor.js";
import DbData from "./db/DbData.js";

/**
 * Insert WD data to local DB.
 */
const db = new DbData();
// db.insert(data);

// Define the directory where your JSON files are located
const directoryPath = './output';

const files = new FileProcessor(db);
files.processFiles(directoryPath);
