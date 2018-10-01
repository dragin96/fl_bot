var email = require('emailjs');
var server = email.server.connect({
    user: process.env.mail_sender, //'leha.iwanow@yandex.ru',
    password: process.env.mail_pass,//'password',
    host: process.env.mail_host, //'smtp.yandex.ru',
    ssl: true
});

function sendMail(text) {
    let htmlText = text.replace(/\n/g, '<br>');
    server.send({
        text: 'rapapam',
        from: '<no-reply@devplace.tech>',
        to: process.env.mail_to,
        subject: 'Cтатистика',
        attachment: [{
            data: `<html>${htmlText}</html>`,
            alternative: true
        }]
    }, function (err, message) {
        console.log(err || message);
    });
}
exports.sendMail = sendMail;
//sendMail('\n отправленно сообщений 1\n принято сообщений 2\n сообщений с ошибками\n')
