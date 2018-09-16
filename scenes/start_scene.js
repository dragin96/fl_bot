const Scene = require('node-vk-bot-api/lib/scene');

module.exports.init_start_scene = function (printMenu) {
    const start_scene = new Scene('start_scene',
        (ctx) => {
            console.log('start_scene enter ');

            if (ctx.message.text.toLowerCase() == "получить ответ") {
                ctx.scene.leave();
                return ctx.scene.enter('print_menu');
            }
            ctx.session.stage = "start";

            printMenu(ctx, 'start');
            console.log('first start_scene end');
        });

    return start_scene;
};