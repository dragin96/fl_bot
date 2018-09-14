const path_module = require('path');
const readdirSync = require('readdirsync2');

function getDir(path) {
    return readdirSync(path, {only: 'directory', ignoreName: ["node_modules"], recursive: false});
}

function getFile(path) {
    return readdirSync(path, {
        only: 'file'
    });
}
/**
 * Get struct dir  for chat bot
 * @param path {string} directory path
 * @returns {Object}
 */
function structFile(path) {
    let res = {}
    let dirs = getDir(path);
    console.log(dirs);
    
    dirs.forEach(dir => {
        pathJoin = path_module.join(path, dir);
        res[dir] = structFile(pathJoin);
        if (Object.keys(res[dir]).length == 0){
            res[dir] = getFile(pathJoin);
        }
    });
    return res;
}
exports.structFile = structFile;
// let url = "./test/"
// console.log(structFile(url));
