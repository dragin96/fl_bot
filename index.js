const logger = require('./logger.js').logger;
const dotenv = require('dotenv');
const result = dotenv.config({
  path: './config.env'
});
if (result.error) {
  throw logger.info('init config error' + result.error);
}
logger.info('init config', result.parsed);

const schemes = require('./schemes.js');
const Statistic = require('./statistic-scheme.js').Statistic;
//schemes.setLogger(logger);




const mongoose = require('./mongoose.js');
mongoose.setLogger(logger);
mongoose.setStudent(schemes.Student);
mongoose.setStatistic(Statistic);
const Mongo = mongoose.Mongo;


const sendStatistic = require('./sendStatistic.js').sendStatistic;

const VkBot = require('node-vk-bot-api');
const bot = new VkBot({
  token: process.env.vk_bot_token,
  group_id: '132152902'
});

(async () => {
  let statistic = await Mongo.getStatistic();
  if (statistic == null) {
    logger.error('Statistic is null');
    throw 'Statistic is null';
  }
  require('./vk_chat_bot.js').startVkChatbot(logger, Mongo, statistic);
  setInterval(() => {
    sendStatistic(Mongo, statistic);
  }, 5 * 60 * 1000);
})();