const $less = require("less");
const $fs = require("fs");
const $path = require("path");
const $glob = require("glob");

/**
 * Compile given LESS style
 * @param {String} file File name
 * @param {Function} logger
 */
async function compileLessFile(file, logger) {
	return new Promise(function (resolve, reject) {
		$fs.readFile(file, "utf-8", (err, data) => {
			if (err) {
				reject(new Error("Error ocurs while reading file '" + file + "' while less compiling."));
				return;
			}

			// Compile less to css with compression
			$less.render(data, {compress: true, paths: [$path.dirname(file)]}, (err, compiled) => {
				if (err) {
					reject(new Error("Error ocurs while compiling less style '" + file + "'. " + err.message));
					return;
				}

				// create name for CSS file
				file = file.substr(0, file.length - 4) + "css";

				// Write to CSS file
				$fs.writeFile(file, compiled.css, (err) => {
					if (err) {
						reject(new Error("Error ocurs while writing compiled file '" + file + "'. " + err.message));
						return;
					}

					logger("Less style was compiled into '" + file + "'", watch.INFO);
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
			// Ignore nested folders. Nested folders should be included by path pattern
			//list = list.concat(matchFiles(filename, filter));
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
 * @param {Function} logger
 */
async function compileFolder(path, logger) {
	const lessFiles = matchFiles(path, /\.less$/);
	const proms = [];

	for (let file of lessFiles) {
		proms.push(compileLessFile(file, logger));
	}

	return Promise.all(proms);
}

/**
 * @callback WatcherLogger
 * @param {string} msg Message
 * @param {string} logType Type of message (error, warn, info)
 */

/**
 *
 * @param {Array<string>} paths
 * @param {WatcherLogger} logger
 * @param {boolean} justCompile
 * @returns {Promise.<void>}
 */
async function watch (paths, logger, justCompile = false) {
	if (!logger) logger = function() {};

	let failedPaths = 0;

	// Go through input paths and start watching them
	for (let path of paths) {
		try {
			await new Promise(function(done) {
				$glob(path, async function(err, paths) {
					if (err) throw err;

					for (let path of paths) {
						try {
							const stat = $fs.statSync(path);

							if (!stat.isDirectory()) {
								continue;
							}
							
							// First compile that folder
							await compileFolder(path, logger);

							let nextChangeAfter = new Date();
							let changes = [];

							if (justCompile) {
								continue;
							}

							$fs.watch(path, function (eventType, filename) {
								changes.push(filename);

								if ((new Date()).getTime() < nextChangeAfter) {
									return;
								}

								nextChangeAfter = new Date().getTime() + 1000;

								// Cuz some OSs emit more messages for one event
								setTimeout(() => {
									// After time out check if some file in last 1 second was LESS
									if (changes.some(el => el.match(/\.less$/))) {
										// noinspection JSIgnoredPromiseFromCall
										compileFolder(path, logger).catch(function(err) {
											logger(err.message, watch.ERR);
										});
									}

									changes = [];
								}, 100);
							});
						} catch (ex) {
							logger("Path '" + path + "' caused error. " + ex.message, watch.ERR);
							failedPaths++;
						}
					}

					done();
				});
			});
		} catch (ex) {
			logger("Path '" + path + "' caused error. " + ex.message, watch.ERR);
			failedPaths++;
		}
	}

	if (failedPaths != paths.length) {
		if (justCompile) {
			logger("LESS files just compiled");
		} else {
			logger("Watch LESS Compiler is watching...", watch.INFO);
		}
	}
}

module.exports = {
	watch: watch,
	compileFolder: compileFolder,
	msgType: {
		ERR: "error",
		WARN: "warn",
		INFO: "info"
	}
};