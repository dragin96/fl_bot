const VkBot = require('node-vk-bot-api');
const Markup = require('node-vk-bot-api/lib/markup');

const Session = require('node-vk-bot-api/lib/session');
const Stage = require('node-vk-bot-api/lib/stage');

const vk = require('./vk.js');
const vk_api = vk.vk_api;

const books = require('./dirRead.js').structFile(process.env.books_path);

module.exports.startVkChatbot = function (logger, Mongo, statistic) {
    // logger.info('books', books);

    function getMenuText(ctx) {
        const class_lvl = ctx.session.class_lvl;
        const stage = ctx.session.stage;

        let text = getText('print_menu_' + stage, {
            class_lvl,
            task_first: ctx.session.task_first,
            task_last: ctx.session.task_last
        });

        switch (stage) {
            case 'start':
                text = 'Выбери необходимое действие';
                break;
            case 'select_object':
                break;
            case 'author':
                break;
            case 'part':
                if (ctx.session.is_overfull_keys) {
                    text = `У нас здесь слишком много разделов, пожалуйста, введи цифру нужного тебе ${ctx.session.part_subname? ctx.session.part_subname : 'раздела'} от ${ctx.session.overfull_first_key} до ${ctx.session.overfull_last_key}`;
                }
                break;
            case 'subpart':
                if (ctx.session.is_overfull_keys) {
                    text = `У нас здесь слишком много подразделов, пожалуйста, введи цифру нужного тебе ${ctx.session.part_subname? ctx.session.part_subname : 'подраздела'} от ${ctx.session.overfull_first_key} до ${ctx.session.overfull_last_key}`;
                } else {
                    text = 'Выбери подраздел';
                }
                break;
            case 'task':
                break;
            case 'get_answer':
                text = `Нужен другой ответ по ${ctx.session.class_lvl} классу, предмету ${ctx.session.subject} автору ${ctx.session.author}? – вводи номер от ${ctx.session.task_first} до ${ctx.session.task_last}! &#128526;`;
                break;
        }

        return text;
    }

    function compareNumeric(a, b) {
        let match_a = a.match(/\d+/);
        let match_b = b.match(/\d+/);
        if (match_a && match_b) {
            return match_a - match_b;
        }
        return 0;
    }



    function getButtons(ctx) {
        if (!ctx.session || !ctx.session.class_lvl) {
            logger.error('какая-то хрень с session', ctx.session);
            return null;
        }
        
        let id;
        if(ctx.message && (ctx.message.from_id || ctx.message.peer_id)){
            id = ctx.message.from_id || ctx.message.peer_id;
        }
        const class_lvl = ctx.session.class_lvl;
        const stage = ctx.session.stage;
        const subject = ctx.session.subject;
        const author = ctx.session.author;
        const task = ctx.session.task;
        let part = ctx.session.part;
        let parts = ctx.session.parts;
        let keyboards = [];
        let keyboards_submassive = [];
        let keys = [];
        let books_part;

        logger.info(id + ' join getButtons switch stage=' + stage + '; class_lvl=' + class_lvl + '; subject=' + subject + '; author=' + author + '; part=' + part + ';parts=' + parts + '; task=' + task);
       

        switch (stage) {
            case 'need_change_class':
                keyboards.push([Markup.button('Сменить класс', 'negative', 'stats')]);
                //keyboards.push([Markup.button('Инструкция', 'positive', 'stats')]);
                break;
            case 'select_object':
                if (books[class_lvl] === undefined) {
                    logger.warn(`class_lvl ${class_lvl} not found`);
                    statistic.saveWrongReq({
                        first_name: ctx.session.student.name,
                        vk_id: ctx.message.from_id || ctx.message.peer_id,
                        class_lvl,
                        message: ctx.message.text
                    });
                    return null;
                }
                keys = Object.keys(books[class_lvl]);

                keyboards.push([Markup.button('Экстренная помощь', 'positive', 'stats'), Markup.button('Добавить предмет/автора', 'positive', 'stats')]);
                keyboards.push([Markup.button('Сменить класс', 'negative'), Markup.button('Инструкция', 'positive')]);

                break;
            case 'author':
                if (books[class_lvl][subject] === undefined) {
                    logger.warn(`subject ${subject} not found in ${class_lvl}`);
                    statistic.saveWrongReq({
                        first_name: ctx.session.student.name,
                        vk_id: ctx.message.from_id || ctx.message.peer_id,
                        class_lvl,
                        subject,
                        message: ctx.message.text
                    });
                    return null;
                }
                keys = Object.keys(books[class_lvl][subject]);
                keyboards.push([Markup.button('Экстренная помощь', 'positive', 'stats'), Markup.button('Добавить предмет/автора', 'positive', 'stats')]);
                keyboards.push([Markup.button('Сменить предмет', 'negative'), Markup.button('Инструкция', 'positive')]);
                break;
            case 'part':
                if (books[class_lvl][subject][author] === undefined) {
                    logger.warn(`author ${author} not found in ${class_lvl}, ${subject}`);
                    statistic.saveWrongReq({
                        first_name: ctx.session.student.name,
                        vk_id: ctx.message.from_id || ctx.message.peer_id,
                        class_lvl,
                        subject,
                        author,
                        message: ctx.message.text
                    });
                    return null;
                }
                keys = Object.keys(books[class_lvl][subject][author]);
                keyboards.push([Markup.button('Сменить предмет', 'negative')]);
                break;
            case 'subpart':
                books_part = books[class_lvl][subject][author];
                for (let part of ctx.session.parts) {
                    if (books_part[part] == undefined) {
                        logger.warn(`${part} not found in ${class_lvl}, ${subject}, ${author}, ${parts}`);
                        statistic.saveWrongReq({
                            first_name: ctx.session.student.name,
                            vk_id: ctx.message.from_id || ctx.message.peer_id,
                            class_lvl,
                            subject,
                            author,
                            parts,
                            message: ctx.message.text
                        });
                        return null;

                    }

                    books_part = books_part[part];
                }
                keys = Object.keys(books_part);
                keyboards.push([Markup.button('Сменить предмет', 'negative', 'stats'), Markup.button('Сменить раздел', 'negative')]);
                break;
            case 'task':
                if (parts && parts.length) {
                    books_part = books[class_lvl][subject][author];
                    for (let part of ctx.session.parts) {
                        if (books_part[part] == undefined) {
                            logger.warn(`${part} not found in ${class_lvl}, ${subject}, ${author}, ${parts}`);
                            statistic.saveWrongReq({
                                first_name: ctx.session.student.name,
                                vk_id: ctx.message.from_id || ctx.message.peer_id,
                                class_lvl,
                                subject,
                                author,
                                parts,
                                message: ctx.message.text
                            });
                            return null;
                        }
                        books_part = books_part[part];
                    }
                    keys = Object.keys(books_part);
                } else {
                    if (books[class_lvl][subject][author][part] === undefined) {
                        statistic.saveWrongReq({
                            first_name: ctx.session.student.name,
                            vk_id: ctx.message.from_id || ctx.message.peer_id,
                            class_lvl,
                            subject,
                            author,
                            parts,
                            message: ctx.message.text
                        });
                        logger.warn(`${part} not found in ${class_lvl}, ${subject}, ${author}, ${part}`);
                        return null;
                    }
                    keys = Object.keys(books[class_lvl][subject][author][part]);
                }
                keys = keys.sort(compareNumeric);
                if (keys.length) {
                    ctx.session.task_first = keys[0];
                    ctx.session.task_last = keys[keys.length - 1];
                }
                keys = [];
                keyboards.push([Markup.button('Сменить предмет', 'negative', 'stats'), Markup.button('Сменить раздел', 'negative')]);
                break;
            case 'get_answer':
                keyboards.push([Markup.button('Статистика', 'primary', 'stats')]);
                keyboards.push([Markup.button('Сменить предмет', 'negative', 'stats'), Markup.button('Сменить раздел', 'negative')]);
                keyboards.push([Markup.button('Инструкция', 'positive')]);
                break;
        }
        try {
            const keys_length = keys.length;
            ctx.session.is_overfull_keys = false;
            keys = keys.sort(compareNumeric);
            let max_button_in_row = 3;
            if (keys_length <= 8) {
                max_button_in_row = 1;
            } else if (keys_length <= 16) {
                max_button_in_row = 2;
            } else if (keys_length <= 24) {
                max_button_in_row = 3;
            } else if (keys_length <= 32) {
                max_button_in_row = 4;
            } else {
                ctx.session.is_overfull_keys = true;
                ctx.session.overfull_first_key = keys[0];
                ctx.session.overfull_last_key = keys[keys_length - 1];
                keys = [];
            }
            for (let key of keys) {
                if(key.length >= 40){
                    key = key.substr(0, 39);
                }
                if (~key.toLowerCase().indexOf('модуль')) {
                    ctx.session.part_subname = 'модуль';
                } else if (~key.toLowerCase().indexOf('§')) {
                    ctx.session.part_subname = '§';
                } else if (~key.toLowerCase().indexOf('глава')) {
                    ctx.session.part_subname = 'глава';
                } else if (~key.toLowerCase().indexOf('упражнение')) {
                    ctx.session.part_subname = 'упражнение';
                }
                if (max_button_in_row > 2 && ctx.session.part_subname) {
                    key = key.replace(ctx.session.part_subname, '');
                }
                keyboards_submassive.push(Markup.button(key, 'primary'));
                if (keyboards_submassive.length == max_button_in_row) {
                    keyboards.unshift(keyboards_submassive);
                    keyboards_submassive = [];
                }
            }
            if (keyboards_submassive.length) {
                keyboards.unshift(keyboards_submassive);
            }
        } catch (e) {
            logger.error('error with getbuttons part2' + e.message + ' ' + e.stack);
        }
        if(!keyboards.length){
            logger.warn(`${id} keyboards length is null`);
            return null;
        }
        return keyboards;
    }

    function printMenu(ctx) {
        try {
            let keyboards = getButtons(ctx); 
            let text = getMenuText(ctx);
            if (keyboards && keyboards.length) {
                ctx.reply(text, null, Markup.keyboard(keyboards).oneTime());
                return true;
            } else if(keyboards && !keyboards.length){
                ctx.reply(text);
            }
        } catch (e) {
            logger.error('print menu error' + e.message + ' ' + e.stack);
        }
        return null;
    }

    function changeClass(ctx) {
        logger.info('changeClass');
        ctx.session.class_lvl = '';
        ctx.scene.leave();
        ctx.scene.enter('change_class');
        logger.info('change class end');
    }

    const bot = new VkBot({
        token: process.env.vk_bot_token,
        group_id: process.env.vk_group_id
    });

    const getText = require('./scenes/text_scenes.js').getText;
    const print_menu_scene = require('./scenes/print_menu_scene.js').init_print_menu_scene(getText, printMenu, vk_api, books, bot, compareNumeric, changeClass, getButtons, logger, getMenuText, statistic);
    const remember_scene = require('./scenes/remember_scene.js').init_remember_scene(getText, Mongo, logger, vk_api, bot);
    const start_scene = require('./scenes/start_scene.js').init_start_scene(printMenu, changeClass, logger);
    const change_class_scene = require('./scenes/change_class_scene.js').init_change_class_scene(logger);
    const session = new Session();
    const stage = new Stage(print_menu_scene, remember_scene, start_scene, change_class_scene);
    bot.use(session.middleware());
    bot.use(stage.middleware());





    bot.event('group_leave', async (ctx) => {
        const id = ctx.message.user_id;
        const name = await vk_api.getName(id).catch(logger.error);
        ctx.reply(`${name? name : 'Эх'}, жаль, что ты от нас уходишь! Тебе что-то не понравилось? Расскажи нам об этом: https://vk.com/topic-143873827_37354320 Я исправлюсь &#128519;`);
    });
    bot.event('group_join', async (ctx) => {
        ctx.reply('Спасибо большое за твою подписку!');
    });
    bot.on(async (ctx) => {
        logger.info('get message on', ctx.message);
        if (ctx.message.type != 'message_new') {
            return logger.info('Отклоняю событие ' + ctx.message.type);
        }
        const id = ctx.message.from_id || ctx.message.peer_id;
        const student = await Mongo.getStudentById(id).catch(err=>{
            logger.error(err);
            return;
        });
       /* ctx.session.upTime=new Date();
        setInterval(()=>{
            if(new Date() - ctx.session.upTime > 6 * 60 * 60 * 1000){
                logger.info(`reset user with id = ${id} because long time not activity`);
                ctx.stage.leave();
                delete ctx.session.subject;
                delete ctx.session.author;
                delete ctx.session.parts;
                delete ctx.session.part;
                delete ctx.session.task;
                delete ctx.session.is_last_part;
                ctx.session.upTime=new Date();
            }
        }, 3 * 60 * 60 * 1000);*/

        //такого ученика нет в базе
        if (student === null) {
            //сцена ввода класса
            logger.info(id + ' in remember');
            ctx.session.name = await vk_api.getName(id).catch(logger.error);
            ctx.scene.enter('remember_me');
        } else {
            //сцена выбора действий
            logger.info(id + ' in choise');
            ctx.session.class_lvl = student.class_lvl;
            ctx.session.student = student;
            ctx.session.name = student.name;
            ctx.reply(getText('hello_again', {
                name: student.name
            }));
            ctx.scene.enter('print_menu');
        }
    });
    bot.startPolling();
};