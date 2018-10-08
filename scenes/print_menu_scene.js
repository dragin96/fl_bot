const Scene = require('node-vk-bot-api/lib/scene');

const Markup = require('node-vk-bot-api/lib/markup');
module.exports.init_print_menu_scene = function (getText, printMenu, vk_api, books, bot, compareNumeric, changeClass, getButtons, logger, getMenuText, statistic) {
    function isLastPart(ctx) {
        try {
            const class_lvl = ctx.session.class_lvl;
            const subject = ctx.session.subject;
            const author = ctx.session.author;
            const parts = ctx.session.parts;

            let books_part = books[class_lvl][subject][author];
            for (let part of parts) {
                books_part = books_part[part];
            }
            const subparts_keys = Object.keys(books_part);
            return subparts_keys.length && Array.isArray(books_part[subparts_keys[0]]);
        } catch (e) {
            logger.warn('isLastPart path not founded ' + JSON.stringify(ctx.session));
            return true;
        }
    }

    function error_menu_handler(ctx, stage) {
        const id = ctx.message.from_id || ctx.message.peer_id;
        logger.info(id + ' error_menu_handler ' + stage);
        ctx.session.parts = [];
        ctx.session.stage = stage == 'subpart' ? 'part' : stage;
        const text = getText('error_menu', {});
        ctx.reply(text);
        return printMenu(ctx);
    }

    function getStatistic(ctx) {
        const statistic = ctx.session.student.getStatistic();
        //logger.info('моя статистика ' + statistic);
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
        const id = ctx.message.from_id || ctx.message.peer_id;
        logger.info(`${id} ctx_menu_handler enter, msg=${ctx.message.text}, text_param=${text_param}, stage=${stage}, ret_stage=${ret_stage}, ret_step=${ret_step}`);
        let isReturn = ctx.message.text == 'Вернуться';
        isReturn = isReturn || ctx.message.text == 'Сменить раздел';
        isReturn = isReturn || ctx.message.text == 'Сменить автора';
        isReturn = isReturn || ctx.message.text == 'Сменить предмет';
        if (ctx.message.text == 'Сменить класс') {
            clear_session(ctx);
            changeClass(ctx);
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
            if (ctx.session.stage == 'subpart') {
                logger.info(id + ' ctx_menu_handler return subpart');
                ctx.session.stage = 'part';
            } else if(!ret_stage || !ret_step){
                logger.error(`bad ret stage (${ret_stage}) or ret step (${ret_step}) `);
            } else {
                logger.info(`${id} ctx_menu_handler return step (${ret_step}) and ret stage (${ret_stage})`);
                ctx.session.stage = ret_stage;
                ctx.scene.selectStep(ret_step);
            }
            ctx.session.parts = [];
            printMenu(ctx);
            return 'return';
        }

        logger.info(id + ' запоминаю ' + text_param + ' ' + ctx.message.text);
        logger.info(id + ' next stage ' + stage);
        ctx.session[text_param] = ctx.message.text;
        ctx.session.stage = stage;
    }

    async function getAnswer(ctx, task) {
        const id = ctx.message.from_id || ctx.message.peer_id;
        const class_lvl = ctx.session.class_lvl;
        const subject = ctx.session.subject;
        const author = ctx.session.author;
        let parts = ctx.session.parts;
        logger.info(id + ' getAnswer ' + ctx.session.class_lvl + ' ' + ctx.session.subject + ' ' + ctx.session.author + ' ' + ctx.session.part + ' ' + task);

        try {
            let books_part = books[ctx.session.class_lvl][ctx.session.subject][ctx.session.author];

            let path = process.env.books_path;
            path += ctx.session.class_lvl;
            path += '/' + ctx.session.subject;
            path += '/' + ctx.session.author;

            let book_paths;

            if (ctx.session.parts) {
                for (let part of ctx.session.parts) {
                    books_part = books_part[part];
                    path += '/' + part;
                }

                book_paths = books_part[task];
            } else {

                path += '/' + ctx.session.part;
                book_paths = books[ctx.session.class_lvl][ctx.session.subject][ctx.session.author][ctx.session.part][task];
            }

            let attachments = '';
            for (let splt of book_paths) {
                let subpath = path;
                subpath += '/' + splt.trim();
                logger.info(id + ' PATH ' + subpath);
                const res = await vk_api.uploadPhoto(subpath, ctx.message.peer_id).catch(logger.error);
                if(!res) {
                    logger.error(`error with getAnswer, bad res ${res}`);
                    return 'error';
                }
                logger.info(id + ' res ' + res);
                attachments += 'photo' + res[0].owner_id + '_' + res[0].id + ',';
            }
            return attachments.substr(0, attachments.length - 1);
        } catch (e) {
            statistic.saveWrongReq({
                first_name: ctx.session.student.name,
                vk_id: ctx.message.from_id || ctx.message.peer_id,
                class_lvl,
                subject,
                author,
                parts,
                message: ctx.message.text
            });
            logger.warn(id + ' getanswer error' + e);
            return null;
        }

    }

    function getCompare(mas, key) {
        mas = mas.sort(compareNumeric);
        for (let el of mas) {
            if (~el.indexOf(key)) {
                return el;
            }
        }
        return null;
    }

    function clear_session(ctx) {
        delete ctx.session.subject;
        delete ctx.session.author;
        delete ctx.session.parts;
        delete ctx.session.part;
        delete ctx.session.task;
        delete ctx.session.is_last_part;
    }

    function changeSubject(ctx) {
        const id = ctx.message.from_id || ctx.message.peer_id;
        logger.info(id + ' change subject');
        ctx.session.stage = 'select_object';
        ctx.session.parts = [];
        ctx.scene.selectStep(1);
        printMenu(ctx);
    }

    function checkCtx(ctx) {
        ctx.session.upTime=new Date();
        if (ctx.message.type != 'message_new') {
            logger.info('Отклоняю событие ' + ctx.message.type);
            return 'return';
        }
        let match=ctx.message.text.match(/\[.*\],? /);
        if(match){
            ctx.message.text=ctx.message.text.replace(match[0], '');
        }
        if (ctx.message.text == '/reset') {
            logger.info(`Пользователь id=${ctx.message.from_id || ctx.message.peer_id} хочет сбросить бота`);
            clear_session(ctx);
            ctx.reply('Бот успешно сброшен! Напиши что-нибудь, чтобы появилось меню.');
            ctx.scene.leave();
            return 'return';
        }
        return null;
    }

    function selectObjectStep(ctx) {
        const id = ctx.message.from_id || ctx.message.peer_id;
        let message = ctx.message.text;
        try {
            logger.info('first print_menu_scene, id=' + id + '; message=' + message);
            if (checkCtx(ctx) === 'return') {
                return;
            }
            message = ctx.message.text;
            ctx.session.stage = 'select_object';
            if (ctx.message.text == 'Сменить класс') {
                logger.info(id + ' first print_menu_scene return, change class; message=' + message);
                return changeClass(ctx);
            }
            const res = printMenu(ctx);
            if (res === null) {
                let text = `Извини, похоже, мы не сможем тебе помочь, у нас нет учебников для ${ctx.session.class_lvl} класса. Попробуй изменить номер класса или сообщи моим создателям об этой неприятности в группе &#128519;. Ссылка:
https://vk.com/gdz_bot`;
                ctx.session.stage = 'need_change_class';
                let keyboards = getButtons(ctx);
                logger.info('first print_menu_scene return, null res, id=' + id + '; message=' + message);
                return ctx.reply(text, null, Markup.keyboard(keyboards).oneTime());
                /* ctx.reply(text, null, );
                ctx.session.stage = 'need_change_class';
                //printMenu(ctx, 'start');
                ctx.scene.leave();
                return ctx.scene.enter('start_scene');*/

            }
            ctx.scene.next();
            logger.info(id + ' first print_menu_scene end message=' + message);
        } catch (e) {
            logger.error(id + ' first print_menu_scene error message=' + message + ';error=' + e.message + ' ' + e.stack);
        }
    }

    function selectSubjectStep(ctx) {
        const id = ctx.message.from_id || ctx.message.peer_id;
        let message = ctx.message.text;
        try {
            logger.info('second print_menu_scene, id=' + id + '; message=' + message);
            if (checkCtx(ctx) === 'return') {
                return;
            }
            message = ctx.message.text;
            const res_handler = ctx_menu_handler(ctx, 'subject', 'author');
            if (res_handler == 'return') {
                logger.info('second print_menu_scene return, res_handler, id=' + id + '; message=' + message);
                return;
            }
            let onlyButton = false;

            const res = printMenu(ctx, onlyButton);
            if (res === null) {
                logger.info('second print_menu_scene return, res null, id=' + id + '; message=' + message);
                return error_menu_handler(ctx, 'select_object');
            }
            ctx.scene.next();
            logger.info('second print_menu_scene end, id=' + id + '; message=' + message);
        } catch (e) {
            logger.error('second print_menu_scene error, id=' + id + '; message=' + message + ';error=' + e.message + ' ' + e.stack);
        }
    }

    function selectAuthorStep(ctx) {
        const id = ctx.message.from_id || ctx.message.peer_id;
        let message = ctx.message.text;
        try {
            if (checkCtx(ctx) === 'return') {
                return;
            }
            message = ctx.message.text;
            const res_handler = ctx_menu_handler(ctx, 'author', 'part', 'select_object', 1);
            if (res_handler == 'return') {
                logger.info('third print_menu_scene return, res_handler, id=' + id + '; message=' + message);
                return;
            }
            //let books_part;
            /* try {
                 books_part = Object.keys(books[ctx.session.class_lvl][ctx.session.subject][ctx.session.author]);
                 if (books_part.length == 1) {
                     ctx.session.stage = 'task';
                     ctx.session.part = books_part[0];
                 }
             } catch (e) {
                 logger.warn('books_part not found id=' + id + '; error message=' + e);
             }*/
            const res = printMenu(ctx);
            if (res === null) {
                logger.info('third print_menu_scene return, res null, id=' + id + '; message=' + message);
                return error_menu_handler(ctx, 'author');
            }
            /*if (books_part.length == 1) {
                ctx.scene.selectStep(4);
            } else {
                ctx.scene.next();
            }*/
            ctx.scene.next();
            logger.info('third print_menu_scene end, id=' + id + '; message=' + message);
        } catch (e) {
            logger.error('third print_menu_scene error, id=' + id + '; message=' + message);
        }
    }

    function selectPartStep(ctx) {
        const id = ctx.message.from_id || ctx.message.peer_id;
        let message = ctx.message.text;
        try {
            logger.info('fourth print_menu_scene, id=' + id + '; message=' + message);
            if (checkCtx(ctx) === 'return') {
                return;
            }
            message = ctx.message.text;
            if (ctx.message.text == 'Сменить предмет') {
                logger.info(id + ' fourth print_menu_scene return, changesubject');
                clear_session(ctx);
                return changeSubject(ctx);
            }
            if (ctx_menu_handler(ctx, 'part', 'task', 'author', 2) == 'return') {
                logger.info('fourth print_menu_scene return, res_handler , id=' + id + '; message=' + message);
                return;
            }
            if (!ctx.session.parts) {
                ctx.session.parts = [];
            }

            let books_part = books[ctx.session.class_lvl][ctx.session.subject][ctx.session.author];
            for (let part of ctx.session.parts) {
                if (books_part[part] == undefined) {
                    logger.error('ebola sluchilas s razdelom`', part);
                }
                books_part = books_part[part];
            }

            let new_part = ctx.message.text;
            if (books_part[new_part] == undefined) {
                console.log(`Не найден раздел ${new_part}, пробую найти по ключу`);
                const key = getCompare(Object.keys(books_part), new_part);
                if (key) {
                    console.log('Ключ найден!', key);
                    new_part = key;
                } else {
                    logger.warn(`Ключ ${new_part} не найден`);
                }
            }

            ctx.session.parts.push(new_part);
            const is_last_part = isLastPart(ctx);
            console.log('IS LAST PART', is_last_part);

            if (!is_last_part) {
                ctx.session.stage = 'subpart';
                let keyboards = getButtons(ctx);
                let text = getMenuText(ctx);
                return ctx.reply(text, null, Markup.keyboard(keyboards).oneTime());
            }
            const res = printMenu(ctx);
            if (res === null) {
                logger.info('fourth print_menu_scene return, res null, id=' + id + '; message=' + message);
                return error_menu_handler(ctx, 'part');
            }
            ctx.scene.next();
            logger.info('fourth print_menu_scene end, id=' + id + '; message=' + message);
        } catch (e) {
            logger.error('fourth print_menu_scene error, id=' + id + '; message=' + message + ';error ' + e.message + ' ' + e.stack);
        }
    }

    async function selectTaskStep(ctx) {
        const id = ctx.message.from_id || ctx.message.peer_id;
        let message = ctx.message.text;
        try {
            logger.info('finally print_menu_scene, id=' + id + '; message=' + message);
            if (checkCtx(ctx) === 'return') {
                return;
            }
            message = ctx.message.text;
            ctx.session.stage = 'get_answer';
            if (ctx.message.text == 'Инструкция') {
                let keyboards = getButtons(ctx);
                ctx.reply(getText('instruction', {}), null, Markup.keyboard(keyboards).oneTime());
                logger.info('finally print_menu_scene return, instruction, id=' + id + '; message=' + message);
                return;
            } else if (ctx.message.text == 'Сменить раздел') {
                ctx.session.stage = 'part';
                ctx.session.parts = [];
                ctx.scene.selectStep(3);
                logger.info('finally print_menu_scene return, smenit razdel');
                return printMenu(ctx);
            } else if (ctx.message.text == 'Статистика') {
                ctx.reply(getStatistic(ctx));
                logger.info('finally print_menu_scene return, statistic');
                return printMenu(ctx);
            } else if (ctx.message.text == 'Сменить предмет') {
                logger.info('finally print_menu_scene return, changesubject');
                clear_session(ctx);
                return changeSubject(ctx);
            } else if (ctx.message.text == 'Сменить класс') {
                logger.info('finally print_menu_scene return, changeclass');
                clear_session(ctx);
                return changeClass(ctx);
            }

            ctx.session.task = ctx.message.text;
            const attachments = await getAnswer(ctx, ctx.session.task).catch(logger.error);
            if (attachments && attachments!='error') {
                logger.info(id + ' Отправляю ответ, attachments', attachments);

                const answers = ['Вот твой ответ', 'Лови!', 'Дерзай!', 'Держи ответ'];


                bot.sendMessage(ctx.message.peer_id, answers[Math.floor(Math.random() * answers.length)], attachments);

                const answer_num = ctx.session.student.answer_num || 1;
                const last_agit_day = ctx.session.student.last_agit_day;
                const friend_reply_times = ctx.session.student.friend_reply_times || 0;
                const feedback_times = ctx.session.student.feedback_times || 0;

                const is_member_group = await vk_api.isMemberGroup(id).catch(logger.error);
                //const is_have_feedback = await vk_api.isHaveFeedback(id).catch(logger.error);
                logger.info(id + ' is day for agit? ' + last_agit_day + ' ' + !last_agit_day || new Date() - last_agit_day > 3 * 24 * 60 * 60 * 1000);
                if(!last_agit_day || new Date() - last_agit_day > 3 * 24 * 60 * 60 * 1000){
                    logger.info(id + ` now time for agit, answer_num=${answer_num}, friend_reply_times=${friend_reply_times}, is_member_group ${is_member_group}, feedback_times ${feedback_times}`);
                    if (answer_num % 1 === 0 && !is_member_group) {
                        logger.info(`${id} say for subscribe`);
                        ctx.reply(getText('get_answer_subscribe', {}));
                    } else if (answer_num % 2 === 0 && friend_reply_times < 3) {
                        logger.info(`${id} say for reply friends`);
                        ctx.session.student.upFriendReplyTime();
                        ctx.reply(getText('get_answer_friend_reply', {}));
                    } else if (answer_num % 3 === 0 && feedback_times < 5) {
                        logger.info(`${id} say for feedback`);
                        ctx.session.student.upFeedbackTime();
                        ctx.reply(getText('get_answer_feedback', {}));
                    }
                    if(answer_num == 3){
                        ctx.session.student.resetAgit();
                    } else {
                        ctx.session.student.upAnswerNum();
                    }
                }
              
                ctx.session.student.saveStatistic(ctx.session.subject);
            } else if(attachments && attachments=='error'){
                ctx.reply('Извини, что-то пошло не так, попробуй еще раз');
            } else {
                ctx.reply(getText('error_menu', {}));
            }
            printMenu(ctx);
            logger.info('finally print_menu_scene end, id=' + id + '; message=' + message);
        } catch (e) {
            logger.error('finally print_menu_scene error, id=' + id + '; message=' + message + ';error=' + e.message + ' ' + e.stack);
        }
    }

    const print_menu_scene = new Scene('print_menu',
        selectObjectStep,
        selectSubjectStep,
        selectAuthorStep,
        selectPartStep,
        selectTaskStep
    );
    return print_menu_scene;
};