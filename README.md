# Чат бот для вк ГДЗ

## Конфигурация

1. Создать файл в корне проекта config.env
``` nano config.env ```
1. переменные в этом файле имеют вид имя_переменной = 'значения'
1. vk_bot_token - токен группы
1. vk_group_id - ид группы
1. mongo_login и mongo_password логин и пароль БД
1. books_path - путь где лежат книги
1. mail_sender - отправитель статистики mail_pass - пароль почты mail_host - хост почты

## Запуск
```
npm i
node index.js
``` 