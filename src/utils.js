/**
 * Format time as ms.
 * @param {Number} startTime performance.now()
 * @param {Number} endTime 
 * @returns 
 */
export function formatElapsedTime(startTime, endTime, perNum) {
	let elapsedMs = endTime - startTime;

	if (typeof perNum === 'number') {
		elapsedMs /= perNum;
	}

	const ms = Math.floor(elapsedMs % 1000);
	let elapsedS = Math.floor((elapsedMs - ms) / 1000);
	const minutes = Math.floor(elapsedS / 60);
	let seconds = (elapsedS - minutes * 60);
	seconds = (''+seconds).padStart(2, '0');

	return `${minutes}:${seconds}.${(''+ms).padStart(3, '0')} [m:s.ms]`;
}