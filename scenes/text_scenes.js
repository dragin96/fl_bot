module.exports.getText = function getText(text, params) {

    const texts = {
        hello: `Привет, ${params.name}!

Тебе нужна помощь? 
Помогу чем смогу!

В каком ты классе?`,
        hello_again: `Привет, ${params.name}, рад снова тебя видеть!`,
        im_remember: `Всё, я запомнил! Ты в ${params.class_lvl} классе
Ну, я старше тебя, потому могу помочь! Скажи, какой тебе предмет нужен.`,
        im_remember_next: ``,
        print_menu: `Выбери предмет из моего списка для ${params.class} класса:`,
        print_menu_select_object: `Выбери предмет из моего списка для ${params.class_lvl} класса нажав на кнопку`,
        print_menu_author: `Выбери нужного автора`,
        print_menu_part: `Выбери нужный раздел`,
        print_menu_task: `Напиши нам номер твоего задания`,
        error_class: `Пожалуйста, укажи верный класс`,
        error_menu: `Прости, оказывается пока я не могу тебе помочь (грустный смайлик), такого нет в нашей базе, но ты можешь ускорить мое обучение! Сообщи разработчикам, какого учебника тебе не хватает: vk.com/topic-143873827_41677637 Спасибо за понимание! (смайлик)
        
        Eсли тебе срочно нужна помощь с заданием, напиши сюда: https://vk.com/topic-143873827_41665643 Кто-нибудь обязательно поможет! (смайлик)`,
        get_answer_feedback: `Если ответ оказался правильным, пожалуйста, оставь отзыв: vk.com/topic-143873827_37354320 Нам очень важно знать, что тебе всё нравится! Спасибо! (смайлик)`,
        get_answer_reply: `Нужно еще какое-то задание по учебнику "${params.book}"? - пиши! (смайлик) Если нужен другой предмет, нажми на кнопку "сменить предмет", а если нужен другой класс, нажми на кнопку "сменить класс"`,
    };

    return texts[text];
};