/**
 * Export local DB data to MW table.
 */
import process from 'node:process';
import MediaWikiDumper from "./db/MediaWikiDumper.js";

// Create an instance of the MediaWikiDumper class
const mediaWikiDumper = new MediaWikiDumper();

// Connect to the database and dump the result as a MediaWiki table
try {
	await mediaWikiDumper.top();
	await mediaWikiDumper.states();
} catch (error) {
	console.error(error);
	process.exit(500);
}
