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
	const remover = new FileRemover();
	const dirPath = './output/mw/';
	const files = await remover.readDirectory(dirPath, /woj.+\.wiki/);

	// subpages
	const configs = [];
	files.forEach((file) => {
		const deployConfig = new DeployConfig({
			src: path.join(dirPath, file),
			dst: pageTitle(file),
		});
		configs.push(deployConfig);
	});

	// summary
	configs.push(new DeployConfig({
		src: 'output_states_list.wiki',
		dst: pageTitle('lista.wiki'),
	}));
	configs.push(new DeployConfig({
		src: 'output_states_all.wiki',
		dst: pageTitle('wszystko.wiki'),
	}));

	// todo: top
	configs.push(new DeployConfig({
		src: 'output_top.wiki',
		dst: 'Wikipedysta:Nux/test WLZ duplikaty',
	}));

	// execute
	await ployBot.deploy(configs);
	
})().catch(err => {
	console.error(err);
	process.exit(500);
});