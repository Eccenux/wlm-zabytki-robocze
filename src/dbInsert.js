import FileProcessor from "./FileProcessor.js";
import DbData from "./db/DbData.js";

/**
 * Insert WD data to local DB.
 */
const db = new DbData();
// db.insert(data);

// WARNING! Removes previous data (for one table)
await db.createTable();

// Define the directory where your JSON files are located
const directoryPath = './output';

const files = new FileProcessor(db);
await files.processFiles(directoryPath);

// test exists
/**
let re = await db.exists({
	"coord": {
		"lat": "52.87475",
		"lon": "14.203194"
	},
	"itemLabel": "Cmentarz żydowski w Cedyni",
	"townLabel": "Cedynia",
	"item": "Q11690917",
	"town": "Q954143"
});
console.log({re});
/**/