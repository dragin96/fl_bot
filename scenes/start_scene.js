const Scene = require('node-vk-bot-api/lib/scene');

module.exports.init_start_scene = function (printMenu, changeClass) {
    

    const start_scene = new Scene('start_scene',
        (ctx) => {
            console.log('start_scene enter', ctx.message.text);

            if (ctx.message.text.toLowerCase() == "получить ответ" && ctx.session.stage != "need_change_class") {
                ctx.scene.leave();
                return ctx.scene.enter('print_menu');
            } else if(ctx.message.text.toLowerCase() == "сменить класс"){
                return changeClass(ctx);
            }
            
            ctx.session.stage = "start";
            printMenu(ctx, 'start');
            console.log('first start_scene end');
        });

    return start_scene;
};