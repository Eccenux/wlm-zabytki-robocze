import DbData from "./db/DbData.js";

/**
 * Insert WD data to local DB.
 */
const data = {
	"category": "Białowieża zażółć gęślą jaźń",
	"coord": {
		"lat": "52.731572",
		"lon": "23.867764"
	},
	"itemLabel": "Puszcza Białowieska",
	"townLabel": "województwo podlaskie",
	"image": "http://commons.wikimedia.org/wiki/Special:FilePath/Wisent.jpg",
	"item": "Q192666",
	"town": "Q54177"
};

const db = new DbData();
db.insert(data);
