import MediaWikiDumper from "./db/MediaWikiDumper.js";

// Create an instance of the MediaWikiDumper class
const mediaWikiDumper = new MediaWikiDumper();

// Connect to the database and dump the result as a MediaWiki table
mediaWikiDumper.top();
