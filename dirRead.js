const path_module = require('path');
const readdirSync = require('readdirsync2');

function getDir(path) {
	return readdirSync(path, {only: 'directory', ignoreName: ['node_modules'], recursive: false});
}

function getFile(path) {
	let files = readdirSync(path, {
		only: 'file',
		recursive: false
	});
	let objFile = {};
	files.forEach((file) => {
		let index = file.replace(/\(\d+\).(jpg|png|jpeg|gif|txt)|\.(jpg|png|jpeg|gif|txt)/g, '');
		if (!Array.isArray(objFile[index])){
			objFile[index] = [];
		}
		objFile[index].push(file);
	});
	return objFile;
}
/**
 * Get struct dir  for chat bot
 * @param path {string} directory path
 * @returns {Object}
 */
function structFile(path) {
	let res = {};
	let dirs = getDir(path);
	dirs.forEach(dir => {
		let pathJoin = path_module.join(path, dir);
		res[dir] = structFile(pathJoin);
		if (Object.keys(res[dir]).length == 0){
			res[dir] = getFile(pathJoin);
		}
	});
	return res;
}
module.exports.structFile = structFile;
// let url = './test/'
// console.log(structFile(url)[1]['автор1']['учебник1']);
