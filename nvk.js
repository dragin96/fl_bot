
//vk.setLogger(logger);
const dotenv = require('dotenv');
const result = dotenv.config({
    path: './config.env'
});
const vk = require('./vk.js');
const fs = require('fs');
const vk_api = vk.vk_api;
(async () => {
    fs.readFile('C:\\Users\\1037234\\Desktop\\100MEDIA\\08312243_2011.JPG', function(err, data) {
        if (err)  console.log("DATA err", err);; // Fail if the file can't be read.
        console.log("DATA USPEH", data);
    });
    let photo=fs.createReadStream('C:\\Users\\1037234\\Desktop\\100MEDIA\\08312243_2011.JPG');
    console.log("PHOTO USPEH", photo)
})();

