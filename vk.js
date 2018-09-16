const { VK,  } = require('vk-io');
const vk = new VK();
const { auth } = vk;
const readline = require('readline');
const owner_id= "-132152902";
//let logger;
let logger = require('./logger.js').logger;
vk.setOptions({
	app: 6492244,
	login: process.env.vk_login,
	password: process.env.vk_password
});


vk.setCaptchaHandler(async ({ src }, retry) => {
	
	console.log(process.env.vk_login, process.env.vk_password);
	const key = await myAwesomeCaptchaHandler(src);
	console.log("KEY IS", key);
	try {
		await retry(key);

		console.log('Капча успешно решена');
	} catch (error) {
		console.log('Капча неверная',error );
	}
});
/*Для лога*/
module.exports.setLogger=function(_logger){
	logger=_logger;
};
async function myAwesomeCaptchaHandler(src){
	return new Promise((resolve)=>{
		console.log(src);
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
		rl.question('Введите капчу: ', (answer) => {
			rl.close();
			resolve(answer);
		});
	});
}
async function getTwoFactorCode(){
	return new Promise((resolve)=>{
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
		rl.question('Введите код доступа: ', (answer) => {
			rl.close();
			resolve(answer);
		});
	});
}
vk.setTwoFactorHandler(async (payload, retry) => {
	const code = await getTwoFactorCode();

	try {
		await retry(code);
		logger.info("vk.js>>",'Двух факторная авторизация пройдена');
	} catch (error) {

		logger.info("vk.js>>",'Двух факторная авторизация провалилась', error);
		//const code = await getTwoFactorCode();
		//await retry(code);
	}
});



const vk_api = {
	implicitFlow: auth.implicitFlowUser(),
	/*Запоминаем полученный токен после авторзации*/
	setToken: (token) => {
		vk.setToken(token);
	},
	getName: async (id) => {
		console.log('get name for id', id);
		const response = await vk.api.users.get({
			user_ids: id
		});
		console.log('name is', response[0].first_name);
		return response[0].first_name;
	},
	isMemberGroup: async (id) => {
		const response = await vk.api.groups.isMember({
			group_id: process.env.vk_group_id,
			user_id: id,
			extended: 0
		});
		return Boolean(response);
	},
	isHaveFeedback: async (id, start = 0) => {
		let res = await vk.api.board.getComments({
			group_id: 25892529, //process.env.vk_group_id,
			topic_id: 29438053, //process.env.vk_topic
			count: 100,
			start_comment_id: start
		})
		const users = res.items;
		//пришел из топика последний пост возвратим false
		if (users.length < 2) {
			console.log(false);
			return false;
		}
		for (let i = 0; i < users.length; i++) {
			const user = users[i];
			console.log(user.from_id);
			if (id == user.from_id) {
				return true;
			}
			if (users.length - 1 == i) {
				vk_api.isHaveFeedback(id, user.id);
			}
		}
	}
};

module.exports.vk_api = vk_api

vk_api.setToken("b6a451703cc1122dfd72b04a3bf43904c88a668fcd9bd21ccc80e27006f734a276d3551af92a6c8bb33c1");

