function getText(text, params) {

    const texts = {
        hello: `Привет!

Тебе нужна помощь? 
Помогу чем смогу!

В каком ты классе?`,

        im_remember: `Всё, я запомнил! Ты в ${params.class} классе`,
        im_remember_next: `Ну, я старше тебя, потому могу помочь! Скажи, какой тебе предмет нужен?`,
        print_menu: 'Выбери предмет из моего списка для ${params.class} класса:`'

    }
    console.log("TEXT TUT", text);
    return texts[text];
}

const VkBot = require('node-vk-bot-api');
const Markup = require('node-vk-bot-api/lib/markup')
const Scene = require('node-vk-bot-api/lib/scene');
const Session = require('node-vk-bot-api/lib/session')
const Stage = require('node-vk-bot-api/lib/stage')
let students = {};
module.exports.startVkChatbot = function (logger, clan_api, lock) {
    const bot = new VkBot({
        token: process.env.vk_bot_token,
        group_id: process.env.vk_group_id
    })
    bot.command('/mood', (ctx) => {
        console.log('getcommand mood');
        ctx.reply('How are you doing?', null, Markup
            .keyboard([
                [
                    Markup.button('Normally', 'primary'),
                ],
                [
                    Markup.button('Fine', 'positive'),
                    Markup.button('Bad', 'negative'),
                ]
            ]))
    })

    bot.command('/sport', (ctx) => {
        console.log('getcommand sport');
        ctx.reply('Select your sport', null, Markup
            .keyboard([
                'Football',
                'Basketball',
            ])
            .oneTime())
        console.log('getcommand sport success');
    })

    /*bot.on((ctx) => {
        logger.info('get message');
        const text=getText('hello', {});
       
        ctx.reply(text);
    });*/
    bot.startPolling();
};