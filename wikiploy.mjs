/**
 * Deploy as a gadget.
 */
import process from 'node:process';
import {DeployConfig, WikiployLite} from 'wikiploy';
import FileRemover from './src/FileRemover.js';
import path from 'path';

import * as botpass from './bot.config.mjs';
import MediaWikiDumper from './src/db/MediaWikiDumper.js';
const ployBot = new WikiployLite(botpass);

// custom summary
ployBot.summary = () => {
	return `WLZ`;
}

function pageTitle(file) {
	return MediaWikiDumper.pageTitle(file);
}

(async () => {
	const configs = [];

	/**/
	// subpages config
	const remover = new FileRemover();
	const dirPath = './output/mw/';
	const files = await remover.readDirectory(dirPath, /woj.+\.wiki/);
	files.forEach((file) => {
		const deployConfig = new DeployConfig({
			src: path.join(dirPath, file),
			dst: pageTitle(file),
		});
		configs.push(deployConfig);
	});

	// summary config
	configs.push(new DeployConfig({
		src: 'output_states_list.wiki',
		dst: pageTitle('lista.wiki'),
	}));
	configs.push(new DeployConfig({
		src: 'output_states_all.wiki',
		dst: pageTitle('wszystko.wiki'),
	}));
	/**/

	// top config
	configs.push(new DeployConfig({
		src: 'output_top.wiki',
		dst: 'Wikipedysta:Nux/test WLZ duplikaty top',
	}));

	// execute
	await ployBot.deploy(configs);

	// purge main (force update of transclusions)
	const bot = await ployBot.getBot(configs[0]);
	bot.request({
		action: 'purge',
		titles: "Wikipedysta:NuxBot/WLZ_duplikaty",
	}).then((data) => {
		let purged = data?.purge;
		if (!purged) {
			console.warn('Unable to purge', data);
			return;
		}
		const info = purged.map(p=>`Page "${p.title}" purge status: ${p.purged?'OK - purged':'fail?'}`);
		console.log(info.join('\n'));
	});

})().catch(err => {
	console.error(err);
	process.exit(500);
});