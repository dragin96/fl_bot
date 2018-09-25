const {
	VK,
} = require('vk-io');
const request = require('request');
const fs = require('fs');
const vk = new VK();
const {
	auth
} = vk;
const readline = require('readline');
//const owner_id = '-132152902';
//let logger;
let logger = require('./logger.js').logger;
vk.setOptions({
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
});
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
			});
			console.log('name is', response[0].first_name);
			return response[0].first_name;
		},
		uploadPhoto: (path, id) => {
			return new Promise(async resolve => {
				const response = await vk.api.photos.getMessagesUploadServer({
					id: id
				});

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
					console.log('Upload successful!  Server responded with:', body);
					body = JSON.parse(body);
					const response = await vk.api.photos.saveMessagesPhoto({
						server: body.server,
						photo: body.photo,
						hash: body.hash
					});
					resolve(response);
				});
			});
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
					group_id: process.env.vk_group_id,
					topic_id: process.env.vk_topic,
					count: 100,
					start_comment_id: start
				});
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

//vk_api.setToken('32dfd60225f6439c1519eb6b316431c4d1fcef9e29647690303497c72cc36bac1879b50c156f1f4a1fe17');
vk_api.setToken(process.env.vk_bot_token);