
const logger = require('./logger.js').logger;
const dotenv=require('dotenv');
const result = dotenv.config({path: './config.env'});
if (result.error) {
  throw logger.info("init config error" + result.error);
}
logger.info("init config", result.parsed);

const schemes=require('./schemes.js');
schemes.setLogger(logger);




const mongoose=require('./mongoose.js');
mongoose.setLogger(logger);
mongoose.setStudent(schemes.Student);
const Mongo=mongoose.Mongo;


require('./vk_chat_bot.js').startVkChatbot(logger, Mongo);

(async()=>{
})();

