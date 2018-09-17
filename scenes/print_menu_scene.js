const Scene = require('node-vk-bot-api/lib/scene');

module.exports.init_print_menu_scene = function (getText, printMenu, vk_api, books, bot, Mongo, changeClass) {
    function error_menu_handler(ctx, stage) {
        ctx.session.stage = stage;
        const text = getText('error_menu', {});
        ctx.reply(text);
        return printMenu(ctx);
    }

    function ctx_menu_handler(ctx, text_param, stage, ret_stage, ret_step) {
        if (ctx.message.text == 'Сменить класс') {
            changeClass(ctx);
            return 'return';
        } else if (ctx.message.text == 'Отмена') {
            ctx.scene.leave();
            ctx.scene.enter('start_scene');
            return 'return';
        } else if (ctx.message.text == 'Вернуться') {
            console.log('Жму вернуться');
            ctx.session.stage = ret_stage;
            ctx.scene.selectStep(ret_step);
            printMenu(ctx);
            return 'return';
        }

        ctx.session[text_param] = ctx.message.text;
        ctx.session.stage = stage;
    }

    async function getAnswer(ctx, task) {
        try {
            if (books[ctx.session.class_lvl][ctx.session.subject][ctx.session.author][ctx.session.part][task] == undefined) {
                return null;
            }
            let path = process.env.books_path;
            path += ctx.session.class_lvl;
            path += '\\' + ctx.session.subject;
            path += '\\' + ctx.session.author;
            path += '\\' + ctx.session.part;

            const book_paths = books[ctx.session.class_lvl][ctx.session.subject][ctx.session.author][ctx.session.part][task];
           

            let attachments = '';
            for (let splt of book_paths) {
                let subpath = path;
                subpath += '\\' + splt.trim();
                console.log('PATH', subpath);
                const res = await vk_api.uploadPhoto(subpath, ctx.message.peer_id);
                console.log('res', res);
                attachments += 'photo' + res[0].owner_id + '_' + res[0].id + ',';
            }



            return attachments.substr(0, attachments.length - 1);
        } catch (e) {
            console.log('getanswer error', e);
            console.log('cannot find', ctx.session.class_lvl, ctx.session.subject, ctx.session.author, ctx.session.part, task);
            return null;
        }

    }

    function changeSubject(ctx) {
        console.log('change subject');
        ctx.session.stage = 'select_object';
        ctx.scene.selectStep(1);
        printMenu(ctx);
    }
    const print_menu_scene = new Scene('print_menu',
        (ctx) => {
            console.log('first print_menu_scene');
            ctx.session.stage = 'select_object';

            const res = printMenu(ctx);
            if (res === null) {

                ctx.reply(`Извини, похоже, мы не сможем тебе помочь, у нас нет учебников для ${ctx.session.class_lvl} класса. Попробуй изменить номер класса или сообщи моим создателям об этой неприятности в группе`);
                ctx.session.stage = 'need_change_class';
                //printMenu(ctx, 'start');
                ctx.scene.leave();
                return ctx.scene.enter('start_scene');

            }
            ctx.scene.next();
            console.log('first print_menu_scene end');
        },
        (ctx) => {
            console.log('second print_menu_scene');

            const res_handler = ctx_menu_handler(ctx, 'subject', 'author');
            if (res_handler == 'return') {
                return;
            }
            const res = printMenu(ctx);
            if (res === null) {
                return error_menu_handler(ctx, 'select_object');
            }
            ctx.scene.next();
            console.log('second print_menu_scene end');

        },
        (ctx) => {
            console.log('third print_menu_scene');

            const res_handler = ctx_menu_handler(ctx, 'author', 'part', 'select_object', 1);
            if (res_handler == 'return') {
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
        async (ctx) => {
            console.log('finally print_menu_scene');
            if (ctx.message.text == 'Вернуться') {
                ctx.scene.leave();
                return ctx.scene.enter('start_scene');
            } else if (ctx.message.text == 'Сменить предмет') {
                return changeSubject(ctx);
            } else if (ctx.message.text == 'Сменить класс') {
                return changeClass(ctx);
            } else if (/\D/.test(ctx.message.text)) {
                ctx.reply('Похоже, ты ввел некорректный номер. Используя только цифры, введи номер задания:');
                return printMenu(ctx);
            }

            ctx.session.task = ctx.message.text;
            ctx.session.stage = 'get_answer';
            const attachments = await getAnswer(ctx, ctx.session.task);
            if (attachments) {
                console.log('Отправляю ответ, attachments', attachments);
                bot.sendMessage(ctx.message.peer_id, 'Ответ под номером ' + ctx.session.task, attachments);


                /*if (vk_api.isHaveFeedback(ctx.session.student.vk_id)) {
                ctx.reply(getText('get_answer_feedback', {}));
                }*/
                ctx.reply(getText('get_answer_reply', {
                    book: ctx.session.author
                }));
                ctx.session.student.saveStatistic(ctx.session.subject);
            } else {
                ctx.reply(getText('error_menu', {}));
            }
            console.log('print menu');
            printMenu(ctx);
            console.log('finally print_menu_scene end');
        });
    return print_menu_scene;
};