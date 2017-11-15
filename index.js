#!/usr/bin/env node

const $less = require("less");
const $fs = require("fs");
const $path = require("path");

// Input path arguments
const ARGS = process.argv.slice(2);

// directory from where script is running
const WORK_DIR = process.cwd();

// Checkfor input paths
if (ARGS.length === 0) {
	console.warn("No paths specified. Exiting.");
	return;
}

// Resolve directory names
const paths = ARGS.map(path => {
	return $path.resolve(WORK_DIR, path);
});

/**
 * Compile given LESS style
 * @param {String} file File name
 */
async function compileLessFile(file) {
	return new Promise(function (resolve, reject) {
		$fs.readFile(file, "utf-8", (err, data) => {
			if (err) {
				console.warn("Error ocurs while reading file '" + file + "' while less compiling.");
				reject();
				return;
			}

			// Compile less to css with compression
			$less.render(data, {compress: true}, (err, compiled) => {
				if (err) {
					//noinspection JSAccessibilityCheck
					console.warn("Error ocurs while compiling less style '" + file
						+ "' in styles compiling processBlock.");
					reject();
					return;
				}

				// create name for CSS file
				file = file.substr(0, file.length - 4) + "css";

				// Write to CSS file
				$fs.writeFile(file, compiled.css, (err) => {
					if (err) {
						//noinspection JSAccessibilityCheck
						console.warn("Error ocurs while writing compiled file '" + file
							+ "' in styles compiling processBlock.");
						reject();
						return;
					}

					//noinspection JSAccessibilityCheck
					console.log("Less style was compiled into '" + file + "'");

					resolve();
				});
			});
		});
	});
}

/**
 * Function returning list of file names which are found under given path
 * @param {String} path Base folder
 * @param {RegExp} filter
 * @returns {Array}
 */
function matchFiles(path, filter) {
	const files = $fs.readdirSync(path);
	let list = [];

	for (let i = 0; i < files.length; i++) {
		let filename = $path.join(path, files[i]);
		let stat = $fs.lstatSync(filename);

		if (stat.isDirectory()) {
			list = list.concat(matchFiles(filename, filter));
		}
		else if (filter.test(filename)) {
			list.push(filename);
		}
	}

	return list;
}

/**
 * Compile files under given path
 * @param {String} path
 */
async function compileFolder(path) {
	const lessFiles = matchFiles(path, /\.less$/);
	const proms = [];

	for (let file of lessFiles) {
		proms.push(compileLessFile(file));
	}

	return Promise.all(proms);
}

(async function () {
	// Go through input paths and start watching them
	for (let path of paths) {
		try {
			// First copile that folder
			await compileFolder(path);

			let nextChangeAfter = new Date();
			let changes = [];

			$fs.watch(path, function (eventType, filename) {
				changes.push(filename);

				if ((new Date()).getTime() < nextChangeAfter) {
					return;
				}
				nextChangeAfter = new Date().getTime() + 1000;

				// Cuz some OSs emit more messages for one event
				setTimeout(() => {
					// After time out check if some file in last 1 second was LESS
					if (changes.some(el => el.match(/\.less/))) {
						// noinspection JSIgnoredPromiseFromCall
						compileFolder(path);
					}
				}, 100);
			});
		} catch (ex) {
			console.error("Trying to watch path '" + path + "' caused error. ", ex.message);
		}
	}

	console.log("Watch LESS Compiler is watching...");
})();