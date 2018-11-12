const Scene = require('node-vk-bot-api/lib/scene');

module.exports.init_remember_scene = function (getText, Mongo, logger, vk_api, bot, checkCtx) {
    const remember_scene = new Scene('remember_me',
        (ctx) => {
            logger.info('first scene remember');
            if (checkCtx(ctx) === 'return') {
                return;
            }
            if (ctx.message.type != 'message_new') {
                return logger.info('Отклоняю событие ' + ctx.message.type);
            }
            ctx.scene.next();
            ctx.reply(getText('hello', {
                name: ctx.session.name
            }));
        },
        async (ctx) => {
            logger.info('second remember scene');
            if (checkCtx(ctx) === 'return') {
                return;
            }
            if (ctx.message.type != 'message_new') {
                return logger.info('Отклоняю событие ' + ctx.message.type);
            }
            const class_lvl = ctx.message.text.match(/\d+/);
            if (class_lvl === null || (class_lvl[0] < 1 || class_lvl[0] > 11)) {
                return ctx.reply(getText('error_class', {}));
            }
            ctx.session.class_lvl = +class_lvl[0];
            ctx.session.student = await Mongo.initStudent(ctx.message.from_id || ctx.message.peer_id, +class_lvl[0], ctx.session.name).catch((err)=>{
                logger.error(`Проблема с созданием студента, прошу попробовать еще раз; ${err}`);
                return ctx.reply('Извини, что-то пошло не так. Попробуй еще раз, пожалуйста, введи номер своего класса');
            });

           
            try {
                if(ctx.message.from_id == ctx.message.peer_id){
                    const res = await vk_api.uploadPhoto('./assets/keyboard.png', ctx.message.peer_id).catch(logger.error);
                    if (res) {
                        let attachments = 'photo' + res[0].owner_id + '_' + res[0].id;
                        bot.sendMessage(ctx.message.peer_id, getText('keyboard', {}), attachments);
                    }
                }
            } catch (e) {
                logger.error(`upload keyboard photo error ${e}`);
            }
            ctx.scene.leave();
            ctx.reply(getText('im_remember', {
                class_lvl
            }));
            ctx.scene.enter('print_menu');


        });
    return remember_scene;
};