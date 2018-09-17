const Scene = require('node-vk-bot-api/lib/scene');

const Markup = require('node-vk-bot-api/lib/markup');
module.exports.init_print_menu_scene = function (getText, printMenu, vk_api, books, bot, Mongo, changeClass, getButtons) {
    function error_menu_handler(ctx, stage) {
        ctx.session.stage = stage;
        const text = getText('error_menu', {});
        ctx.reply(text);
        return printMenu(ctx);
    }

    function getStatistic(ctx) {
        const statistic = ctx.session.student.getStatistic();
        console.log('моя статистика', statistic);
        const no_one_answer_text = 'Похоже, ты еще не спросил ни одного решения';
        if (statistic === undefined) {
            return no_one_answer_text;
        }
        const keys = Object.keys(statistic);
        if (keys.length === 0) {
            return no_one_answer_text;
        }
        let str = `Смотри, сколько раз ты запрашивал ответ по каждому предмету:
        
`;
        for (let key of keys) {
            str += `${key}: ${statistic[key]}
            `;
        }


        return str;
    }

    function ctx_menu_handler(ctx, text_param, stage, ret_stage, ret_step) {
        let isReturn = ctx.message.text == 'Вернуться';
        isReturn = isReturn || ctx.message.text == 'Сменить раздел';
        isReturn = isReturn || ctx.message.text == 'Сменить автора';
        isReturn = isReturn || ctx.message.text == 'Сменить предмет';
        if (ctx.message.text == 'Сменить класс') {
            changeClass(ctx);
            return 'return';
        } else if (ctx.message.text == 'Отмена') {
            ctx.scene.leave();
            ctx.scene.enter('start_scene');
            return 'return';
        } else if (ctx.message.text == 'Экстренная помощь') {
            let keyboards = getButtons(ctx);
            ctx.reply('Переходи по ссылке! https://vk.com/topic-143873827_41665643', null, Markup.keyboard(keyboards).oneTime());
            return 'return';
        } else if (ctx.message.text == 'Инструкция') {
            let keyboards = getButtons(ctx);
            ctx.reply(getText('instruction', {}), null, Markup.keyboard(keyboards).oneTime());
            return 'return';
        } else if (ctx.message.text == 'Добавить предмет/автора') {
            let keyboards = getButtons(ctx);
            ctx.reply('Переходи по ссылке! https://vk.com/topic-143873827_41677637', null, Markup.keyboard(keyboards).oneTime());
            return 'return';
        } else if (isReturn) {
            console.log('Жму вернуться');
            ctx.session.stage = ret_stage;
            ctx.scene.selectStep(ret_step);
            printMenu(ctx);
            return 'return';
        }
        console.log('запоминаю', text_param);
        ctx.session[text_param] = ctx.message.text;
        ctx.session.stage = stage;
    }

    async function getAnswer(ctx, task) {
        try {
            console.log('test', ctx.session.class_lvl, ctx.session.subject, ctx.session.author, ctx.session.part, task);
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
            if (ctx.message.text == 'Сменить класс') {
                return changeClass(ctx);
            }
            const res = printMenu(ctx);
            if (res === null) {
                let text = `Извини, похоже, мы не сможем тебе помочь, у нас нет учебников для ${ctx.session.class_lvl} класса. Попробуй изменить номер класса или сообщи моим создателям об этой неприятности в группе &#128519;. Ссылка:
                https://vk.com/gdz_bot`;
                ctx.session.stage = 'need_change_class';
                let keyboards = getButtons(ctx);
                return ctx.reply(text, null, Markup.keyboard(keyboards).oneTime());
                /* ctx.reply(text, null, );
                ctx.session.stage = 'need_change_class';
                //printMenu(ctx, 'start');
                ctx.scene.leave();
                return ctx.scene.enter('start_scene');*/

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
            let onlyButton = false;

            const res = printMenu(ctx, onlyButton);
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
            let parts = Object.keys(books[ctx.session.class_lvl][ctx.session.subject][ctx.session.author]);
            if (parts.length == 1) {
                ctx.session.stage = 'task';
                ctx.session.part = parts[0];

            }
            const res = printMenu(ctx);
            if (res === null) {
                return error_menu_handler(ctx, 'author');
            }


            if (parts.length == 1) {
                ctx.scene.selectStep(4);
            } else {
                ctx.scene.next();
            }



            console.log('third print_menu_scene end');
        },
        (ctx) => {
            console.log('fourth print_menu_scene');
            if (ctx_menu_handler(ctx, 'part', 'task', 'author', 2) == 'return') {
                return;
            }
            console.log('test', ctx.session.class_lvl, ctx.session.subject, ctx.session.author);

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
            } else if (ctx.message.text == 'Сменить раздел') {
                ctx.session.stage='part';
                ctx.scene.selectStep(3);
                return printMenu(ctx);
            } else if (ctx.message.text == 'Статистика') {
                ctx.reply(getStatistic(ctx));
                return printMenu(ctx);
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

                const answers = ['Вот твой ответ', 'Лови!', 'Дерзай!', 'Держи ответ'];


                bot.sendMessage(ctx.message.peer_id, answers[Math.floor(Math.random() * answers.length)], attachments);


                /*if (vk_api.isHaveFeedback(ctx.session.student.vk_id)) {
                ctx.reply(getText('get_answer_feedback', {}));
                }*/
                /* ctx.reply(getText('get_answer_reply', {
                     book: ctx.session.author
                 }));*/
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