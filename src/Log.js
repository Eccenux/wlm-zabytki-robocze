import fs from 'fs';

export default class Log {
	constructor(logPath) {
		this._log = logPath;
	}

	/** @private format time */
	toIsoString(date) {
		var tzo = -date.getTimezoneOffset(),
			dif = tzo >= 0 ? '+' : '-',
			pad = function (num) {
				return (num < 10 ? '0' : '') + num;
			};

		return date.getFullYear() +
			'-' + pad(date.getMonth() + 1) +
			'-' + pad(date.getDate()) +
			'T' + pad(date.getHours()) +
			':' + pad(date.getMinutes()) +
			':' + pad(date.getSeconds()) +
			dif + pad(Math.floor(Math.abs(tzo) / 60)) +
			':' + pad(Math.abs(tzo) % 60);
	}

	log(errorMessage) {
		const dt = this.toIsoString(new Date());
		fs.appendFileSync(this._log, '\n'+dt+' '+errorMessage, (err) => {
			if (err) {
				console.error('Error writing to error.log:', err);
			}
		});
	}
}