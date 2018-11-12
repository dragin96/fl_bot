
//vk.setLogger(logger);
const dotenv = require('dotenv');
const result = dotenv.config({
    path: './config.env'
});
const vk = require('./vk.js');
const fs = require('fs');
const vk_api = vk.vk_api;
const VkBot = require('node-vk-bot-api');
const bot = new VkBot({
    token: process.env.vk_bot_token,
    group_id: process.env.vk_group_id
});
(async () => {
  /*  fs.readFile('C:\\Users\\1037234\\Desktop\\100MEDIA\\alert.png', function(err, data) {
        if (err)  console.log("DATA err", err); // Fail if the file can't be read.
        console.log("DATA USPEH", data);
    });*/

    for(let i=0; i<5; i++){
        (async()=>{
            console.log('start', i);
            let path = 'C:\\Users\\1037234\\Desktop\\100MEDIA\\alert.png';
            let photo=fs.createReadStream(path);

            var formData = {
                photo: photo
            };

            const res = await vk_api.uploadPhoto(path, 14200182).catch(console.error);
            if (!res) {
                console.error(`error with getAnswer, bad res ${res}`);
            
            }
            //console.log(' res ' + res);
            let attachments = 'photo' + res[0].owner_id + '_' + res[0].id;
            const answers = ['Вот твой ответ', 'Лови!', 'Дерзай!', 'Держи ответ'];
            bot.sendMessage(14200182, answers[Math.floor(Math.random() * answers.length)], attachments);
        })();
        
    }
})();

