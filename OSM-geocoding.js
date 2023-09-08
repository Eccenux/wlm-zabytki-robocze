/**
	OSM gecoding.

	https://geocode.earth/
*/
// 1. Wpisz tutaj klucz do API.
var apiKey = '__APIKEY__';
// 2. Wpisz adres do rozkodowania (nazwa ulicy powinna być pełna).
var addresses = [
	'Aleksandra Puszkina 3, Przemyśl, Polska',
	'Aleksandra Puszkina 4, Przemyśl, Polska',
];

/** Pobranie współrzędnych dla jednego adresu. */
async function getPos(query) {
	var text = encodeURIComponent(query);
	let re = await fetch(`https://api.geocode.earth/v1/autocomplete?api_key=${apiKey}&text=${text}&size=5&layers=-empire%2C-continent&client=ge-autocomplete-0.7.0`, {
		"credentials": "omit",
		"headers": {
			"Accept-Language": "pl,en-US;q=0.7,en;q=0.3",
			"Sec-Fetch-Dest": "empty",
			"Sec-Fetch-Mode": "cors",
			"Sec-Fetch-Site": "same-site",
		},
		"referrer": "https://geocode.earth/",
		"method": "GET",
		"mode": "cors"
	});
	let data = await re.json();
	console.log({
		query,
		ll: data.features[0].geometry.coordinates.join()
	});
}
/** Pobranie z wielu adresów. */
async function getAll(addresses) {
	for (let i = 0; i < addresses.length; i++) {
		const address = addresses[i];
		await getPos(address);
	}
}
// wykonaj
getAll(addresses);