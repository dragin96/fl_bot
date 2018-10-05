const {
	VK,
} = require('vk-io');
const request = require('request');
const fs = require('fs');
const vk = new VK({
	app: 6492244,
    key: '827849fe827849fe827849fe3a821b59aa88278827849fed973d30c12b20a5fe79552b7'
});
const {
	auth
} = vk;
const readline = require('readline');
//const owner_id = '-132152902';
//let logger;
let logger = require('./logger.js').logger;
/*vk.setOptions({
	app: 6492244,
	login: process.env.vk_login,
	password: process.env.vk_password
});


vk.setCaptchaHandler(async ({
	src
}, retry) => {

	console.log(process.env.vk_login, process.env.vk_password);
	const key = await myAwesomeCaptchaHandler(src);
	console.log('KEY IS', key);
	try {
		await retry(key);

		console.log('Капча успешно решена');
	} catch (error) {
		console.log('Капча неверная', error);
	}
});*/
/*Для лога*/
module.exports.setLogger = function (_logger) {
	logger = _logger;
};
async function myAwesomeCaptchaHandler(src) {
	return new Promise((resolve) => {
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
async function getTwoFactorCode() {
	return new Promise((resolve) => {
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
		logger.info('vk.js>>', 'Двух факторная авторизация пройдена');
	} catch (error) {

		logger.info('vk.js>>', 'Двух факторная авторизация провалилась', error);
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
		}).catch(logger.error);
		if(response){
			return response[0].first_name;
		} 
		return null;
		
	},
	uploadPhoto: (path, id) => {
		return new Promise(async (resolve, reject) => {
			const response = await vk.api.photos.getMessagesUploadServer({
				id: id
			}).catch(logger.error);

			var formData = {
				photo: fs.createReadStream(path)
			};

			request.post({
				url: response.upload_url,
				formData: formData
			}, async function optionalCallback(err, httpResponse, body) {
				if (err) {
					return console.error('upload failed:', err);
				}
				try{
					logger.info('Upload successful!  Server responded with: ' + body);
					body = JSON.parse(body);
					const response = await vk.api.photos.saveMessagesPhoto({
						server: body.server,
						photo: body.photo,
						hash: body.hash
					}).catch((err)=>{
						logger.error(`uploadPhoto error ${err}`);
						resolve(null);
					});
					resolve(response);
				} catch(err){
					logger.error(`uploadPhoto error; body=${body}`);
					reject('bad body');
				}
			});
		});
	},
	isMemberGroup: async (id) => {
		const response = await vk.api.groups.isMember({
			group_id: process.env.vk_group_id,
			user_id: id,
			extended: 0
		}).catch((err)=>{
			logger.error(`isMemberGroup error ${err}`);
			return false;
		});
		return Boolean(response);
	},
	isHaveFeedback: async (id, start = 0) => {
		let res = await vk.setToken('827849fe827849fe827849fe3a821b59aa88278827849fed973d30c12b20a5fe79552b7').api.board.getComments({
			group_id: process.env.vk_group_id,
			topic_id: process.env.vk_topic,
			count: 100,
			start_comment_id: start
		}).catch((err)=>{
			vk_api.setToken(process.env.vk_bot_token);
			logger.error(`isHaveFeedback error ${err}`);
			return false;
		});
		vk_api.setToken(process.env.vk_bot_token);
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

module.exports.vk_api = vk_api;
vk_api.setToken(process.env.vk_bot_token);
