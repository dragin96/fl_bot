const Scene = require('node-vk-bot-api/lib/scene');

module.exports.init_start_scene = function (printMenu, changeClass) {
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

    const start_scene = new Scene('start_scene',
        (ctx) => {
            console.log('start_scene enter', ctx.message.text);

            if (ctx.message.text.toLowerCase() == 'получить ответ' && ctx.session.stage != 'need_change_class') {
                ctx.scene.leave();
                return ctx.scene.enter('print_menu');
            } else if (ctx.message.text.toLowerCase() == 'сменить класс') {
                return changeClass(ctx);
            } else if (ctx.message.text.toLowerCase() == 'статистика') {
                ctx.reply(getStatistic(ctx));
            }

            ctx.session.stage = 'start';
            printMenu(ctx, 'start');
            console.log('first start_scene end');
        });

    return start_scene;
};