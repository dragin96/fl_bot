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

В каком ты классе?`,
        hello_again: `Привет, рад снова тебя видеть!`,
        im_remember: `Всё, я запомнил! Ты в ${params.class_lvl} классе
Ну, я старше тебя, потому могу помочь! Скажи, какой тебе предмет нужен.`,
        im_remember_next: ``,
        print_menu: 'Выбери предмет из моего списка для ${params.class} класса:`',
        print_menu_select_object: `Выбери предмет из моего списка для ${params.class_lvl} класса нажав на кнопку`,
        print_menu_author: `Выбери нужного автора`,
        print_menu_part: `Выбери нужный раздел`,
        print_menu_task: `Напиши нам номер твоего задания`,
        error_class: `Пожалуйста, укажи верный класс`

    }

    return texts[text];
}



module.exports.startVkChatbot = function (logger, Mongo, lock) {
    function printMenu(ctx) {

       // console.log('join printMenu');
        const class_lvl = ctx.session.class_lvl;
        const stage = ctx.session.stage;
        const book_object = ctx.session.book_object;
        const author = ctx.session.author;
        const task = ctx.session.task;
        const part = ctx.session.part;
        if (books[class_lvl] === undefined) {
            logger.error(class_lvl + " class lvl not found");
            return null;
        }


        let keyboards = [];
        let keyboards_submassive = [];
        let keys;
        console.log('join printMenu switch', stage, class_lvl, book_object, author, part, task);
        switch (stage) {
            case "select_object":

                keys = Object.keys(books[class_lvl]);
                break;
            case "author":
                if (books[class_lvl][book_object] === undefined) {
                    logger.error(`${book_object} not found in ${class_lvl}`);
                    return null;
                }
                keys = Object.keys(books[class_lvl][book_object]);
                break;
            case "part":
                if (books[class_lvl][book_object][author] === undefined) {
                    logger.error(`${author} not found in ${class_lvl}, ${book_object}`);
                    return null;
                }
                keys = Object.keys(books[class_lvl][book_object][author]);
                break;
            case "task":
                if (books[class_lvl][book_object][author][part] === undefined) {
                    logger.error(`${part} not found in ${class_lvl}, ${book_object}, ${part}`);
                    return null;
                }
                ctx.reply(getText('print_menu_task', {}));
                return true;
        }
       // console.log('join printMenu keys');
        for (let key of keys) {
            keyboards_submassive.push(Markup.button(key, 'positive'));
            if (keyboards_submassive.length == 2) {
                keyboards.push(keyboards_submassive);
                keyboards_submassive = [];
            }
        }
        if(keyboards_submassive.length){
            keyboards.push(keyboards_submassive);
        }

        if(stage!=="select_object"){
            keyboards.push([Markup.button("Вернуться", 'positive')]);
        }
       
      //  console.log('join printMenu print_menu_');
        const text = getText('print_menu_' + stage, {
            class_lvl
        });
       // console.log('keyboards', keyboards);
        ctx.reply(text, null, Markup.keyboard(keyboards).oneTime());
       // console.log('join printMenu end');
    }

    const bot = new VkBot({
        token: process.env.vk_bot_token,
        group_id: process.env.vk_group_id
    })

    const scene = new Scene('meet',
        (ctx) => {
            console.log('first scene');
            ctx.scene.next();
            ctx.reply('How old are you?');
        },
        (ctx) => {
            ctx.session.age = +ctx.message.text;
            console.log('second scene');
            ctx.scene.next();
            ctx.reply('What is your name?');
        },
        (ctx) => {
            console.log('third scene');
            ctx.session.name = ctx.message.text;

            ctx.scene.leave();
            ctx.reply(`Nice to meet you, ${ctx.session.name} (${ctx.session.age} years old)`);
        })


    const remember_scene = new Scene('remember_me',
        (ctx) => {
            console.log('first scene remember');
            ctx.scene.next();
            ctx.reply(getText('hello', {}));
        },
        (ctx) => {
            console.log('second scene');
            const class_lvl = ctx.message.text.match(/\d+/);
            if (class_lvl === null || (class_lvl[0] < 1 && class_lvl[0] > 11)) {
                return ctx.reply(getText('error_class', {}));
            }
            ctx.session.class_lvl = +class_lvl[0];
            Mongo.initStudent(ctx.peer_id, +class_lvl[0]);
            ctx.scene.leave();
            ctx.reply(getText('im_remember', {
                class_lvl
            }));
            ctx.scene.enter('print_menu');

        })

    const print_menu_scene = new Scene('print_menu',
        (ctx) => {
            console.log('first print_menu_scene');
            ctx.session.stage = "select_object";

            const res=printMenu(ctx);
            if(res===null){
                return ctx.reply("Не найден такой класс");
            }
            ctx.scene.next();
            
            console.log('first print_menu_scene end');
        },
        (ctx) => {
            console.log('second print_menu_scene');
            ctx.session.book_object = ctx.message.text;
            ctx.session.stage = "author";
            
            const res=printMenu(ctx);
            if(res===null){
                ctx.session.stage = "select_object";
                ctx.reply("Не найден такой предмет, попробуйте снова");
                return printMenu(ctx);
            }
            ctx.scene.next();
            console.log('second print_menu_scene end');

        },
        (ctx) => {
            console.log('third print_menu_scene');
            
            if(ctx.message.text=="Вернуться") {
                console.log("Жму вернуться");
                ctx.session.stage = "select_object";
                ctx.scene.selectStep(1);
                return printMenu(ctx);
            }

            ctx.session.author = ctx.message.text;
            ctx.session.stage = "part";

            const res=printMenu(ctx);
            if(res===null){
                
                ctx.session.stage = "author";
                ctx.reply("Не найден такой автор, попробуйте снова");
                return printMenu(ctx);
            }    
            ctx.scene.next();
           
            console.log('third print_menu_scene end');
        },
        (ctx) => {
            console.log('fourth print_menu_scene');
            if(ctx.message.text=="Вернуться") {
                console.log("Жму вернуться");
                ctx.session.stage = "author";
                ctx.scene.selectStep(2);
                return printMenu(ctx);
            }

            ctx.session.part = ctx.message.text;
            ctx.session.stage = "task";
            const res=printMenu(ctx);
            if(res===null){
                ctx.session.stage = "part";
                ctx.reply("Не найден такой раздел, попробуйте снова");
                return printMenu(ctx);
            }    
            ctx.scene.next();
            console.log('fourth print_menu_scene end');
        },
        (ctx) => {
            console.log('finally print_menu_scene');
            ctx.session.task = ctx.message.text;
            ctx.session.stage = "";
            ctx.scene.leave();
            ctx.reply('ура, ты выбрал задание под номером' + ctx.session.task);
            console.log('finally print_menu_scene end');
        })

    const session = new Session();
    const stage = new Stage(scene, print_menu_scene, remember_scene);
    bot.use(session.middleware());
    bot.use(stage.middleware());
    bot.command('/meet', (ctx) => {
        logger.info('get command meet');
        ctx.scene.enter('meet');
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
            ctx.reply(getText('hello_again', {}));
            ctx.scene.enter('print_menu');
        }

        logger.info(student);
        //const text=getText('hello', {});
        //ctx.reply(text);
    });
    bot.startPolling();
};