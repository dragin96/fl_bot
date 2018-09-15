const vk = require('./vk.js');
const vk_api = vk.vk_api;
//vk.setLogger(logger);
const dotenv = require('dotenv');
const result = dotenv.config({
    path: './config.env'
});

(async () => {
    let isGroup = await vk_api.isHaveFeedback(6392295);
    console.log(isGroup);
})();

