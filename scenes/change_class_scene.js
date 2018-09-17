const Scene = require('node-vk-bot-api/lib/scene');

module.exports.init_change_class_scene = function () {
    

    const scene = new Scene('change_class',
        (ctx) => {
            console.log('first change_class scene');
           ctx.reply('На какой класс? (смайлик) Введи цифру');
           ctx.scene.next();
           console.log('first change_class scene end');
        //ctx.reply('Введи номер класса');
        },
        (ctx) => {
            console.log('second change_class');
            if (/\D/.test(ctx.message.text) || +ctx.message.text < 1 || +ctx.message.text > 11) {
                return ctx.reply('Похоже, ты ввёл неправильный номер класса. Можно использовать только число от 1 до 11, попробуй снова. Введи номер класса');
            } else {
                ctx.session.class_lvl = +ctx.message.text;
                console.log('good class');
                ctx.session.student.changeClass(ctx.session.class_lvl);

                ctx.reply('Я запомнил твой новый класс!');
                ctx.scene.leave();
                ctx.scene.enter('print_menu');
            }
            //ctx.reply('Введи номер класса');
            console.log('second change_class scene end');
        });

    return scene;
};