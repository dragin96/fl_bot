const VkBot = require('node-vk-bot-api');
const Markup = require('node-vk-bot-api/lib/markup');

const Session = require('node-vk-bot-api/lib/session');
const Stage = require('node-vk-bot-api/lib/stage');

const vk = require('./vk.js');
const vk_api = vk.vk_api;

const books =  require('./dirRead.js').structFile(process.env.books_path);

//console.log('BOOKS', books);
/*const books = {
    '1': {
        'Математика': {
            'Автор': {
                'Раздел 1': {
                    '1': '1.jpg',
                    '2': '2.jpg'
                }
            }
        },
        'Физика': {
            'Автор': {
                'Раздел 1': {
                    '1': '1.jpg',
                    '2': '2.jpg'
                }
            }
        }
    },
    '2': {
        'Математика': {
            'Макарычев': {
                'Раздел 1': {
                    '1': '1.jpg',
                    '2': '2.jpg'
                }
            }
        },
        'Русский': {
            'Автор': {
                'Раздел 1': {
                    '1': '1.jpg',
                    '2': '2.jpg'
                }
            }
        }
    }
};

*/


module.exports.startVkChatbot = function (logger, Mongo) {
    logger.info(books);
    function printMenu(ctx) {

        // console.log('join printMenu');
        const class_lvl = ctx.session.class_lvl;
        const stage = ctx.session.stage;
        const subject = ctx.session.subject;
        const author = ctx.session.author;
        const task = ctx.session.task;
        const part = ctx.session.part;
       


        let keyboards = [];
        let keyboards_submassive = [];
        let keys=[];
        console.log('join printMenu switch', stage, class_lvl, subject, author, part, task);
        let text = getText('print_menu_' + stage, {
            class_lvl
        });
        
        switch (stage) {
            case 'start':
                text = 'Выбери необходимое действие';
                keyboards.push([Markup.button('Получить ответ', 'primary', 'stats')]);
                keyboards.push([Markup.button('Статистика', 'primary', 'stats'), Markup.button('Сменить класс', 'primary')]);
                break;
            case 'select_object':
                if (books[class_lvl] === undefined) {
                    logger.error(class_lvl + ' class lvl not found');
                    return null;
                }
                keys = Object.keys(books[class_lvl]);
                keyboards.push([Markup.button('Сменить класс', 'primary'), Markup.button('Отмена', 'primary')]);
                break;
            case 'author':
                if (books[class_lvl][subject] === undefined) {
                    logger.error(`subject ${subject} not found in ${class_lvl}`);
                    return null;
                }
                keys = Object.keys(books[class_lvl][subject]);
                keyboards.push([Markup.button('Вернуться', 'primary')]);
                break;
            case 'part':
                if (books[class_lvl][subject][author] === undefined) {
                    logger.error(`author ${author} not found in ${class_lvl}, ${subject}`);
                    return null;
                }
                keys = Object.keys(books[class_lvl][subject][author]);
                keyboards.push([Markup.button('Вернуться', 'primary')]);
                break;
            case 'task':
                if (books[class_lvl][subject][author][part] === undefined) {
                    logger.error(`${part} not found in ${class_lvl}, ${subject}, ${part}`);
                    return null;
                }
                keyboards.push([Markup.button('Вернуться', 'primary')]);
                ctx.reply(getText('print_menu_task', {}), null, Markup.keyboard(keyboards).oneTime());
                return true;
            case 'get_answer':
                text = 'Можешь ввести номер следующего задания этого же учебника или выбрать другой';
                keyboards.push([Markup.button('Вернуться', 'primary')]);
                keys= ['Сменить предмет', 'Сменить класс'];
                break;
        }
        // console.log('join printMenu keys');
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


        ctx.reply(text, null, Markup.keyboard(keyboards).oneTime());
    }

    function changeClass(ctx) {
        console.log('changeClass');
        ctx.session.class_lvl = '';
        ctx.scene.leave();
        ctx.scene.enter('change_class');
    }

    const bot = new VkBot({
        token: process.env.vk_bot_token,
        group_id: process.env.vk_group_id
    });

    const getText = require('./scenes/text_scenes.js').getText;
    const print_menu_scene = require('./scenes/print_menu_scene.js').init_print_menu_scene(getText, printMenu, vk_api, books, bot, Mongo, changeClass);
    const remember_scene = require('./scenes/remember_scene.js').init_remember_scene(getText, Mongo);
    const start_scene = require('./scenes/start_scene.js').init_start_scene(printMenu, changeClass);
    const change_class_scene = require('./scenes/change_class_scene.js').init_change_class_scene(Mongo);
    const session = new Session();
    const stage = new Stage(print_menu_scene, remember_scene, start_scene, change_class_scene);
    bot.use(session.middleware());
    bot.use(stage.middleware());



    /*bot.command('Получить ответ|получить ответ', (ctx) => {
        ctx.scene.enter('print_menu');
    });*/

    bot.on(async (ctx) => {
        logger.info('get message on');
        const id = ctx.message.peer_id;
        const student = await Mongo.getStudentById(id).catch(logger.error);
        //такого ученика нет в базе
        if (student === null) {
            //сцена ввода класса
            logger.info('in remember');
            ctx.session.name = await vk_api.getName(id);
            ctx.scene.enter('remember_me');
        } else {
            //сцена выбора действий
            logger.info('in choise');
            ctx.session.class_lvl = student.class_lvl;
            ctx.session.student = student;
            ctx.session.name = student.name;
            ctx.reply(getText('hello_again', {name: student.name}));
            ctx.scene.enter('start_scene');
            
        }

        logger.info(student);
        //const text=getText('hello', {});
        //ctx.reply(text);
    });
    bot.startPolling();
};