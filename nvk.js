
//vk.setLogger(logger);
const dotenv = require('dotenv');
const result = dotenv.config({
    path: './config.env'
});
const vk = require('./vk.js');
const vk_api = vk.vk_api;
(async () => {
    let a = await vk_api.isHaveFeedback('14200182');
    console.log(a);
})();

