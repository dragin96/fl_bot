const vk = require('./vk.js');
const vk_api = vk.vk_api;
//vk.setLogger(logger);
const dotenv = require('dotenv');
const result = dotenv.config({
    path: './config.env'
});

(async () => {
    vk_api.uploadPhoto("", "14200182");
})();

