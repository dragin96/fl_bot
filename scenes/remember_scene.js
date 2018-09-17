const Scene = require('node-vk-bot-api/lib/scene');

module.exports.init_remember_scene = function (getText, Mongo) {
    const remember_scene = new Scene('remember_me',
        (ctx) => {
            console.log('first scene remember');
            ctx.scene.next();
            ctx.reply(getText('hello', {name: ctx.session.name}));
        },
        async (ctx) => {
            console.log('second remember scene');
            const class_lvl = ctx.message.text.match(/\d+/);
            if (class_lvl === null || (class_lvl[0] < 1 && class_lvl[0] > 11)) {
                return ctx.reply(getText('error_class', {}));
            }
            ctx.session.class_lvl = +class_lvl[0];
            ctx.session.student = await Mongo.initStudent(ctx.message.peer_id, +class_lvl[0], ctx.session.name);
            ctx.scene.leave();
            ctx.reply(getText('im_remember', {
                class_lvl
            }));
            ctx.scene.enter('print_menu');


        });
    return remember_scene;
};