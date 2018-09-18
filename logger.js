

const winston = require('winston');
const moment = require('moment');
const util = require('util');
const MESSAGE = Symbol.for('message');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format(function(info) {
            let prefix = util.format('[%s] [%s]', moment().format('YYYY-MM-DD hh:mm:ss').trim(), info.level.toUpperCase());
            if (info.splat) {
                info.message = util.format('%s %s', prefix, util.format(info.message, ...info.splat));
            } else {
                info.message = util.format('%s %s', prefix, info.message);
            }
            return info;
        })(),
        winston.format(function(info) {
            info[MESSAGE] = info.message + ' ' + JSON.stringify(
                Object.assign({}, info, {
                    level: undefined,
                    message: undefined,
                    splat: undefined
                })
            );
            return info;
        })()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: './logs/log.log' })
    ]
});
module.exports.logger = logger;
