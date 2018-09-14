const VkBot = require('node-vk-bot-api');
const Markup = require('node-vk-bot-api/lib/markup')
const Scene = require('node-vk-bot-api/lib/scene');
const Session = require('node-vk-bot-api/lib/session')
const Stage = require('node-vk-bot-api/lib/stage')


const books = {
    "1": {
        "Математика": {
            "Автор": {
                "Раздел 1": {
                    "1": "1.jpg",
                    "2": "2.jpg"
                }
            }
        },
        "Физика": {
            "Автор": {
                "Раздел 1": {
                    "1": "1.jpg",
                    "2": "2.jpg"
                }
            }
        }
    },
    "2": {
        "Математика": {
            "Макарычев": {
                "Раздел 1": {
                    "1": "1.jpg",
                    "2": "2.jpg"
                }
            }
        },
        "Русский": {
            "Автор": {
                "Раздел 1": {
                    "1": "1.jpg",
                    "2": "2.jpg"
                }
            }
        }
    }
}

function getText(text, params) {

    const texts = {
        hello: `Привет!

Тебе нужна помощь? 
Помогу чем смогу!

Как к тебе обращаться?`,
        hello_again: `Привет, ${params.name}, рад снова тебя видеть!`,
        im_remember: `Всё, я запомнил! Ты в ${params.class_lvl} классе
Ну, я старше тебя, потому могу помочь! Скажи, какой тебе предмет нужен.`,
        im_remember_next: ``,
        print_menu: 'Выбери предмет из моего списка для ${params.class} класса:`',
        print_menu_select_object: `Выбери предмет из моего списка для ${params.class_lvl} класса нажав на кнопку`,
        print_menu_author: `Выбери нужного автора`,
        print_menu_part: `Выбери нужный раздел`,
        print_menu_task: `Напиши нам номер твоего задания`,
        error_class: `Пожалуйста, укажи верный класс`,
        error_menu: `Прости, оказывается пока я не могу тебе помочь (грустный смайлик), такого нет в нашей базе, но ты можешь ускорить мое обучение! Сообщи разработчикам, какого учебника тебе не хватает: vk.com/topic-143873827_41677637 Спасибо за понимание! (смайлик)
        
        Eсли тебе срочно нужна помощь с заданием, напиши сюда: https://vk.com/topic-143873827_41665643 Кто-нибудь обязательно поможет! (смайлик)`,
        get_answer_feedback: `Если ответ оказался правильным, пожалуйста, оставь отзыв: vk.com/topic-143873827_37354320 Нам очень важно знать, что тебе всё нравится! Спасибо! (смайлик)`,
        get_answer_reply: `Нужно еще какое-то задание по (классу), (предмету), (учебнику)? - пиши! (смайлик) Если нужен другой предмет, нажми на кнопку "сменить предмет", а если нужен другой класс, нажми на кнопку "сменить класс"`,
    }

    return texts[text];
}



module.exports.startVkChatbot = function (logger, Mongo, lock) {
    function printMenu(ctx) {

        // console.log('join printMenu');
        const class_lvl = ctx.session.class_lvl;
        const stage = ctx.session.stage;
        const subject = ctx.session.subject;
        const author = ctx.session.author;
        const task = ctx.session.task;
        const part = ctx.session.part;
        if (books[class_lvl] === undefined) {
            logger.error(class_lvl + " class lvl not found");
            return null;
        }


        let keyboards = [];
        let keyboards_submassive = [];
        let keys=[];
        console.log('join printMenu switch', stage, class_lvl, subject, author, part, task);
        let text = getText('print_menu_' + stage, {
            class_lvl
        });

        switch (stage) {
            case "start":
                text = `Выбери необходимое действие`;
                keyboards.push([Markup.button("Получить ответ", 'positive', "stats")]);
                keyboards.push([Markup.button("Статистика", 'positive', "stats"), Markup.button("Сменить класс", 'positive')]);
                break;
            case "select_object":
                keys = Object.keys(books[class_lvl]);
                keyboards.push([Markup.button("Сменить класс", 'positive'), Markup.button("Отмена", 'positive')]);
                break;
            case "author":
                if (books[class_lvl][subject] === undefined) {
                    logger.error(`${subject} not found in ${class_lvl}`);
                    return null;
                }
                keys = Object.keys(books[class_lvl][subject]);
                keyboards.push([Markup.button("Вернуться", 'positive')]);
                break;
            case "part":
                if (books[class_lvl][subject][author] === undefined) {
                    logger.error(`${author} not found in ${class_lvl}, ${subject}`);
                    return null;
                }
                keys = Object.keys(books[class_lvl][subject][author]);
                keyboards.push([Markup.button("Вернуться", 'positive')]);
                break;
            case "task":
                if (books[class_lvl][subject][author][part] === undefined) {
                    logger.error(`${part} not found in ${class_lvl}, ${subject}, ${part}`);
                    return null;
                }
                keyboards.push([Markup.button("Вернуться", 'positive')]);
                ctx.reply(getText('print_menu_task', {}));
                return true;
            case "get_answer":
                text = `Можешь ввести номер следующего задания этого же учебника или выбрать другой`;
                keyboards.push([Markup.button("Вернуться", 'positive')]);
                keys= ["Сменить предмет", "Сменить класс"];
                break;
        }
        // console.log('join printMenu keys');
        for (let key of keys) {
            keyboards_submassive.push(Markup.button(key, 'positive'));
            if (keyboards_submassive.length == 3) {
                keyboards.push(keyboards_submassive);
                keyboards_submassive = [];
            }
        }
        if (keyboards_submassive.length) {
            keyboards.push(keyboards_submassive);
        }


        ctx.reply(text, null, Markup.keyboard(keyboards).oneTime());
    }

    const bot = new VkBot({
        token: process.env.vk_bot_token,
        group_id: process.env.vk_group_id
    })

    const start_scene = new Scene('start_scene',
    (ctx) => {
        console.log('start_scene enter ');
        
        if(ctx.message.text.toLowerCase() == "получить ответ"){
            ctx.scene.leave();
            return ctx.scene.enter('print_menu');
        }
        ctx.session.stage="start";
        
        printMenu(ctx, 'start');
        console.log('first start_scene end');
    })

    const remember_scene = new Scene('remember_me',
        (ctx) => {
            console.log('first scene remember');
            ctx.scene.next();
            ctx.reply(getText('hello', {}));
        },
       /* (ctx) => {
            console.log('second remember scene');

            const name = ctx.message.text;
            if (name.length > 30) {
                return ctx.reply(`Извини, ты ввел длинное имя, пожалуйста, попробуй еще раз. 
Как тебя зовут?`);
            }
            ctx.session.name = name;
            ctx.reply(`Рад знакомству, ${name}! В каком ты классе?`);
            ctx.scene.next();
        },*/
        (ctx) => {
            console.log('third remember scene');
            const class_lvl = ctx.message.text.match(/\d+/);
            if (class_lvl === null || (class_lvl[0] < 1 && class_lvl[0] > 11)) {
                return ctx.reply(getText('error_class', {}));
            }
            ctx.session.class_lvl = +class_lvl[0];
            Mongo.initStudent(ctx.peer_id, +class_lvl[0], ctx.session.name);
            ctx.scene.leave();
            ctx.reply(getText('im_remember', {
                class_lvl
            }));
            ctx.scene.enter('start_scene');
            

        })


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
    function is_get_answer(){
        return true;
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
           
            if (is_get_answer()) {
                ctx.reply('Вот твой ответ под номером ' + ctx.session.task);
                if(is_need_feedback) {
                    ctx.reply(getText('get_answer_feedback', {}));
                }
                ctx.reply(getText('get_answer_reply', {}));
                ctx.session.student.saveStatistic('subject');

            } else {
                ctx.reply("что-то пошло не так");
            }
            console.log('finally print_menu_scene end');
        })

    const session = new Session();
    const stage = new Stage(print_menu_scene, remember_scene, start_scene);
    bot.use(session.middleware());
    bot.use(stage.middleware());
    bot.command('Получить ответ|получить ответ', (ctx) => {
        ctx.scene.enter('print_menu');
    })

    bot.on(async (ctx) => {
        logger.info('get message on');
        const student = await Mongo.getStudentById(ctx.peer_id).catch(logger.error);
        //такого ученика нет в базе
        if (student === null) {
            //сцена ввода класса
            logger.info('in remember')
            ctx.scene.enter('remember_me');
        } else {
            //сцена выбора действий
            logger.info('in choise')
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