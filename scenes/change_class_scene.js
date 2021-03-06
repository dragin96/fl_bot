const Scene = require('node-vk-bot-api/lib/scene');

module.exports.init_change_class_scene = function (logger, checkCtx) {


    const scene = new Scene('change_class',
        (ctx) => {
            const id = ctx.message.from_id || ctx.message.peer_id;
            logger.info(id + ' first change_class scene ' + ctx.message.text);
            if (checkCtx(ctx) === 'return') {
                return;
            }
            if (ctx.message.type != 'message_new') {
                return logger.info('Отклоняю событие ' + ctx.message.type);
            }
            ctx.reply('На какой класс? &#128521; Введи цифру');
            ctx.scene.next();
            //logger.info('first change_class scene end');
            //ctx.reply('Введи номер класса');
        },
        (ctx) => {
            const id = ctx.message.from_id || ctx.message.peer_id;
            logger.info(id + ' second change_class ' + ctx.message.text);
            if (checkCtx(ctx) === 'return') {
                return;
            }
            if (ctx.message.type != 'message_new') {
                return logger.info(id + ' Отклоняю событие ' + ctx.message.type);
            }
            if (/\D/.test(ctx.message.text) || +ctx.message.text < 1 || +ctx.message.text > 11) {
                return ctx.reply('Похоже, ты ввёл неправильный номер класса. Можно использовать только число от 1 до 11, попробуй снова. Введи номер класса');
            } else {
                ctx.session.class_lvl = +ctx.message.text;
                ctx.session.student.changeClass(ctx.session.class_lvl);

                ctx.reply('Я запомнил твой новый класс!');
                ctx.scene.leave();
                ctx.scene.enter('print_menu');
            }
            //ctx.reply('Введи номер класса');
            //logger.info('second change_class scene end');
        });

    return scene;
};