const readdirSync = require('readdirsync2');

function getDir(path) {
    return readdirSync(path, {only: 'directory', ignoreName: ["node_modules"], recursive: false});
}
exports.getDir = getDir;

function getFiles(path) {
    
}