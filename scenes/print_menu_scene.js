const Scene = require('node-vk-bot-api/lib/scene');

module.exports.init_print_menu_scene = function (getText, printMenu, vk_api, books, bot) {
    function error_menu_handler(ctx, stage) {
        ctx.session.stage = stage;
        const text = getText('error_menu', {});
        ctx.reply(text);
        return printMenu(ctx);
    }

    function ctx_menu_handler(ctx, text_param, stage, ret_stage, ret_step) {
        if (ctx.message.text == "Вернуться") {
            console.log("Жму вернуться");
            ctx.session.stage = ret_stage;
            ctx.scene.selectStep(ret_step);
            printMenu(ctx);
            return "return";
        }

        ctx.session[text_param] = ctx.message.text;
        ctx.session.stage = stage;
    }

    function getAnswer(ctx, task) {
        try{
            const res=books[ctx.session.class_lvl][ctx.session.subject][ctx.session.author][ctx.session.part][task];
            return res;
        } catch(e){
            console.log('getanswer error', e);
            console.log('cannot find', ctx.session.class_lvl, ctx.session.subject, ctx.session.author,ctx.session.part, task);
            return null;
        }
      
    }

    const print_menu_scene = new Scene('print_menu',
        (ctx) => {
            console.log('first print_menu_scene');
            ctx.session.stage = "select_object";

            const res = printMenu(ctx);
            if (res === null) {
                return ctx.reply("Не найден такой класс");
            }
            ctx.scene.next();

            console.log('first print_menu_scene end');
        },
        (ctx) => {
            console.log('second print_menu_scene');
            ctx_menu_handler(ctx, 'subject', 'author');
            const res = printMenu(ctx);
            if (res === null) {
                return error_menu_handler(ctx, 'select_object');
            }
            ctx.scene.next();
            console.log('second print_menu_scene end');

        },
        (ctx) => {
            console.log('third print_menu_scene');
            if (ctx_menu_handler(ctx, 'author', 'part', 'select_object', 1) == 'return') {
                return;
            }
            const res = printMenu(ctx);
            if (res === null) {
                return error_menu_handler(ctx, 'author');
            }
            ctx.scene.next();

            console.log('third print_menu_scene end');
        },
        (ctx) => {
            console.log('fourth print_menu_scene');
            if (ctx_menu_handler(ctx, 'part', 'task', 'author', 2) == 'return') {
                return;
            }
            const res = printMenu(ctx);
            if (res === null) {
                return error_menu_handler(ctx, 'part');
            }
            ctx.scene.next();
            console.log('fourth print_menu_scene end');
        },
        (ctx) => {
            console.log('finally print_menu_scene');
            ctx.session.task = ctx.message.text;
            ctx.session.stage = "get_answer";
            const answer = getAnswer(ctx, ctx.session.task);
            if (answer) {
                console.log("ANSWER", answer);
                //ctx.reply('Вот твой ответ под номером ' + ctx.session.task);
                bot.sendMessage(ctx.message.peer_id, "Ответ " + answer, answer);
                console.log('VK_ID FEEDBAK', ctx.session.student.vk_id);
                
                /*if (vk_api.isHaveFeedback(ctx.session.student.vk_id)) {
                    ctx.reply(getText('get_answer_feedback', {}));
                }*/
                ctx.reply(getText('get_answer_reply', {}));
                ctx.session.student.saveStatistic('subject');

            } else {
                ctx.reply("что-то пошло не так");
            }
            console.log('finally print_menu_scene end');
        });
    return print_menu_scene;
};