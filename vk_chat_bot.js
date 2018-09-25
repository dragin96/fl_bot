const VkBot = require('node-vk-bot-api');
const Markup = require('node-vk-bot-api/lib/markup');

const Session = require('node-vk-bot-api/lib/session');
const Stage = require('node-vk-bot-api/lib/stage');

const vk = require('./vk.js');
const vk_api = vk.vk_api;

const books = require('./dirRead.js').structFile(process.env.books_path);

module.exports.startVkChatbot = function (logger, Mongo) {
    logger.info('books', books);

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
                break;
            case 'task':
                break;
            case 'get_answer':
                text = `Нужен другой ответ по ${ctx.session.class_lvl} классу, предмету ${ctx.session.subject} автору ${ctx.session.author}? – вводи номер от ${ctx.session.task_first} до ${ctx.session.task_last}! &#128526;`;
                break;
        }
        return text;
    }

    function getButtons(ctx) {
        if(!ctx.session || !ctx.session.class_lvl){
            logger.error('какая-то хрень с session', ctx.session);
            return null;
        }
      
        const class_lvl = ctx.session.class_lvl;
        const stage = ctx.session.stage;
        const subject = ctx.session.subject;
        const author = ctx.session.author;
        const task = ctx.session.task;
        const part = ctx.session.part;
        const parts = ctx.session.parts;
        let keyboards = [];
        let keyboards_submassive = [];
        let keys = [];
        let books_part;
            
      
        logger.info('join getButtons switch stage=' + stage + '; class_lvl=' + class_lvl + '; subject=' + subject + '; author=' + author + '; part=' + part + '; task=' + task);


        switch (stage) {
            case 'need_change_class':
                keyboards.push([Markup.button('Сменить класс', 'negative', 'stats')]);
                //keyboards.push([Markup.button('Инструкция', 'positive', 'stats')]);
                break;
            case 'select_object':
                if (books[class_lvl] === undefined) {
                    return null;
                }
                keys = Object.keys(books[class_lvl]);

                keyboards.push([Markup.button('Экстренная помощь', 'positive', 'stats'), Markup.button('Добавить предмет/автора', 'positive', 'stats')]);
                keyboards.push([Markup.button('Сменить класс', 'negative'), Markup.button('Инструкция', 'positive')]);

                break;
            case 'author':
                if (books[class_lvl][subject] === undefined) {
                    logger.warn(`subject ${subject} not found in ${class_lvl}`);
                    return null;
                }
                keys = Object.keys(books[class_lvl][subject]);
                keyboards.push([Markup.button('Экстренная помощь', 'positive', 'stats'), Markup.button('Добавить предмет/автора', 'positive', 'stats')]);
                keyboards.push([Markup.button('Сменить предмет', 'negative'), Markup.button('Инструкция', 'positive')]);
                break;
            case 'part':
                if (books[class_lvl][subject][author] === undefined) {
                    logger.warn(`author ${author} not found in ${class_lvl}, ${subject}`);
                    return null;
                }
                keys = Object.keys(books[class_lvl][subject][author]);
                break;
            case 'subpart':
                books_part = books[class_lvl][subject][author];
                for (let part of ctx.session.parts) {
                    books_part = books_part[part];
                }
                keys = Object.keys(books_part);
                keyboards.push([Markup.button('Сменить раздел', 'negative')]);
                break;
            case 'task':
                if(parts && parts.length){
                    books_part = books[class_lvl][subject][author];
                    for (let part of ctx.session.parts) {
                        if(books_part[part] == undefined){
                            logger.warn(`${part} not found in ${class_lvl}, ${subject}, ${author}, ${parts}`);
                            return null;
                        }
                        books_part = books_part[part];
                    }
                    keys = Object.keys(books_part);
                } else {
                    if (books[class_lvl][subject][author][part] === undefined) {
                        logger.warn(`${part} not found in ${class_lvl}, ${subject}, ${author}, ${part}`);
                        return null;
                    }
                    keys = Object.keys(books[class_lvl][subject][author][part]);
                }
                if (keys.length) {
                    ctx.session.task_first = keys[0];
                    ctx.session.task_last = keys[keys.length - 1];
                }
                keys = [];
                keyboards.push([Markup.button('Сменить раздел', 'negative')]);
                break;
            case 'get_answer':
                keyboards.push([Markup.button('Статистика', 'primary', 'stats')]);
                keyboards.push([Markup.button('Сменить предмет', 'negative', 'stats'), Markup.button('Сменить раздел', 'negative')]);
                keyboards.push([Markup.button('Инструкция', 'positive')]);
                break;
        }
        for (let key of keys) {
            keyboards_submassive.push(Markup.button(key, 'primary'));
            if (keyboards_submassive.length == 3) {
                keyboards.unshift(keyboards_submassive);
                keyboards_submassive = [];
            }
        }
        if (keyboards_submassive.length) {
            keyboards.unshift(keyboards_submassive);
        }
        return keyboards;
    }

    function printMenu(ctx) {
        let keyboards = getButtons(ctx);
        let text = getMenuText(ctx);
        if (keyboards) {
            ctx.reply(text, null, Markup.keyboard(keyboards).oneTime());
            return true;
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
    const print_menu_scene = require('./scenes/print_menu_scene.js').init_print_menu_scene(getText, printMenu, vk_api, books, bot, Mongo, changeClass, getButtons, logger);
    const remember_scene = require('./scenes/remember_scene.js').init_remember_scene(getText, Mongo, logger);
    const start_scene = require('./scenes/start_scene.js').init_start_scene(printMenu, changeClass, logger);
    const change_class_scene = require('./scenes/change_class_scene.js').init_change_class_scene(logger);
    const session = new Session();
    const stage = new Stage(print_menu_scene, remember_scene, start_scene, change_class_scene);
    bot.use(session.middleware());
    bot.use(stage.middleware());
    
    /*bot.command('Получить ответ|получить ответ', (ctx) => {
        ctx.scene.enter('print_menu');
    });*/

    bot.on(async (ctx) => {
        logger.info('get message on', ctx.message);
        if (ctx.message.type != 'message_new') {
            return logger.info('Отклоняю событие ' + ctx.message.type);
        }
        const id = ctx.message.peer_id;
        const student = await Mongo.getStudentById(id).catch(logger.error);
        //такого ученика нет в базе
        if (student === null) {
            //сцена ввода класса
            logger.info(id + ' in remember');
            ctx.session.name = await vk_api.getName(id);
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