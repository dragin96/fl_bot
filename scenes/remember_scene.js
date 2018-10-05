const Scene = require('node-vk-bot-api/lib/scene');

module.exports.init_remember_scene = function (getText, Mongo, logger, vk_api, bot) {
    const remember_scene = new Scene('remember_me',
        (ctx) => {
            logger.info('first scene remember');
            if(ctx.message.type!='message_new'){
                return logger.info('Отклоняю событие ' + ctx.message.type);
            }
            ctx.scene.next();
            ctx.reply(getText('hello', {name: ctx.session.name}));
        },
        async (ctx) => {
            logger.info('second remember scene');
            if(ctx.message.type!='message_new'){
                return logger.info('Отклоняю событие ' + ctx.message.type);
            }
            const class_lvl = ctx.message.text.match(/\d+/);
            if (class_lvl === null || (class_lvl[0] < 1 || class_lvl[0] > 11)) {
                return ctx.reply(getText('error_class', {}));
            }
            ctx.session.class_lvl = +class_lvl[0];
            ctx.session.student = await Mongo.initStudent(ctx.message.peer_id, +class_lvl[0], ctx.session.name);
            
            const res = await vk_api.uploadPhoto('./assets/keyboard.png', ctx.message.peer_id);
            let attachments = 'photo' + res[0].owner_id + '_' + res[0].id;

            bot.sendMessage(ctx.message.peer_id,getText('keyboard', {}) , attachments);
            ctx.scene.leave();
            ctx.reply(getText('im_remember', {
                class_lvl
            }));
            ctx.scene.enter('print_menu');


        });
    return remember_scene;
};