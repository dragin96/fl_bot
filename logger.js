const winston = require('winston');
const moment = require('moment');



const tsFormat = () => moment().format('YYYY-MM-DD hh:mm:ss').trim();
const logger = winston.createLogger({
	level: 'debug',
  format: winston.format.json(),
	transports: [
	  new winston.transports.Console(),
	  new winston.transports.File({ filename: 'combined.log' })
	]
  });
module.exports.logger = logger;
/*
module.exports.logger =  logger = winston.createLogger({
	
	transports: [
	  //
	  // - Write to all logs with level `info` and below to `combined.log` 
	  // - Write all logs error (and below) to `error.log`.
	  //
	  new winston.transports.File({ filename: 'error.log', level: 'error', timestamp: tsFormat, }),
	  new (winston.transports.Console)({
		timestamp: tsFormat,
		colorize: true
	}),
	new winston.transports.File({
		filename: './combined.log',
		timestamp: tsFormat,			// makes timestamp 'pretty'
		json: false					// makes log format just like console output
	})
	]
  });
  
  //
  // If we're not in production then log to the `console` with the format:
  // `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
  // 
  if (process.env.NODE_ENV !== 'production') {
	logger.add(new winston.transports.Console({
	  format: winston.format.simple()
	}));
  }

  /*
module.exports.logger = new (winston.Logger)({
	transports: [
	// colorize the output to the console
	new (winston.transports.Console)({
		timestamp: tsFormat,
		colorize: true
	}),
	new winston.transports.File({
		filename: './log.log',
		timestamp: tsFormat,			// makes timestamp 'pretty'
		json: false					// makes log format just like console output
	})
	]
  });*/