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

const vk_api =module.exports.vk_api= {
	implicitFlow: auth.implicitFlowUser(),
	/*Запоминаем полученный токен после авторзации*/
	setToken: (token)=>{
		vk.setToken(token);
	},
	/*Создаем пост на стене сообщества*/
	createPost: async  (message, poll_id)=> {
		const response = await vk.api.wall.post({
			owner_id: owner_id,
			from_group: 1, //от имени сообщества,
			message: message,
			attachments: poll_id? `poll${owner_id}_${poll_id}` : null //прикрепляем опрос
		});

		return response;
	},
	/*Последний пост со стены сообщества*/
	getLastPost: async  ()=> {
		const response = await vk.api.wall.get({
			owner_id: owner_id,
			count: 5
		});
		return response;
	},
	/*Создание опроса*/
	createPoll: async  (question, add_answers) => {
		const response = await vk.api.polls.create({
			question: question,
			owner_id: owner_id,
			add_answers: JSON.stringify(add_answers)
		});
		await vk_api.createPost("", response.id);
	},
	/*Информация об опросе по ид*/
	getPoll: async (id)=> {
		const response = await vk.api.polls.getById({
			owner_id: owner_id,
			poll_id: id
		});
		logger.info("vk.js>>","getPoll", response);
	},
	getComments: async (id)=> {
		const response = await vk.api.wall.getComments({
			owner_id: owner_id,
			post_id: id,
			need_likes: false,
			count: 60
		});
		return response;
		//logger.info("vk.js>>","getComments", response);
	},
	getPlayersFromComments: async ()=>{
		let data=await vk_api.getLastPost();
		if(!data){
			logger.warn("vk.js>> is no data", data);
			return null;
		}
		if(!data.count){
			return null;
		}
		if(!data.items.length){
			logger.warn('Записи на стене отсутствуют');
			return null;
		}
		let item=null;
		for(let i=0; i<5; i++){
			if(~data.items[i].text.search("По результатам голосования следующей")){
				item=data.items[i];
				break;
			}
		}
		if(item.comments){
			let comments=await vk_api.getComments(item.id);
			let players=[];
			for(let comment of comments.items){
				
				comment.text=comment.text.replace(/\[\[id\d+\|/, '[');
				console.log("comment",comment.text);
				let splt=comment.text.split('\n');
				for(let _splt of splt){
					let splt_comma=_splt.split(',');
					for(let _splt_comma of splt_comma){
						players.push(_splt_comma.trim().replace('[@', '').replace(/\]/g, ''));
					}
				}				
			}
			return players;
		}
		return null;
	},
	getLastPoll: async ()=> {
		let data=await vk_api.getLastPost();
		if(!data){
			logger.warn("vk.js>> is no data", data);
			return null;
		}
		if(!data.count){
			return null;
		}
		let item=null;
		if(!data.items.length){
			logger.warn('Записи на стене отсутствуют');
			return null;
		}	
		for(let i=0; i<5; i++){
			if(data.items[i].attachments && data.items[i].attachments[0].type=="poll"){
				item=data.items[i];
				break;
			}
		}
		

		if(!item){
			logger.error('vk.js >> no item');
			return  null;
		}
		if(item.attachments && item.attachments[0].type=="poll"){
			return item;
		} else {
			logger.info("vk.js>>",'Последние два сообщения на стене не являются голосованием');
			return null;
		}
	},
	isPollingState: async ()=>{
		let item=await vk_api.getLastPoll();
		return item !==null;
	},
	getPollingResult: async ()=>{
		let item=await vk_api.getLastPoll();
		if(!item){
			return null;
		}
		let answers=item.attachments[0].poll.answers;
		let result=answers.reduce(function(prev, current) {
			return (prev.votes > current.votes) ? prev : current;
		});

		return result.text;
	},
	getPollingCreatedDate: async()=>{

		let item=await vk_api.getLastPoll();
		if(!item){
			return null;
		}
		return item.attachments[0].poll.created;
	},
	getExtraText: async()=>{
		let extra_text= await vk_api.getPollingResult();
		return extra_text;
		
	},
	createPostByMaxRate: async(date, min_players, cost, extra_text)=>{
		
		if(!extra_text){
			logger.info("vk.js>>",'createPostByMaxRate: bad extra_text', extra_text);
			return false;
		}
		let response=await vk_api.createPost(
		`По результатам голосования следующей экстрой для закупа становится: ${extra_text}!

Время проведения закупа при наборе минимального количества людей: ${new Date(date).toLocaleDateString()} в 19:00.
Минимальное количество участников: ${min_players}.
Сумма монет для взноса: ${cost}.

Внимание, закуп будет проведен только при наборе минимального количества участников, так же, после вступления в клан, у вас будет только десять минут для внесения оплаты

Записаться на закуп вы можете через нашего бота в игре [@Автозакупы_bestmafia], оставив комментарий с точной копией своего ника под данной записью или написав сообщение в это сообщество.`);

		if(!response){
			logger.info("vk.js>>",'createPostByMaxRate: bad response', response);
			return false;
		}
		return true;

	}
};


vk_api.setToken("b6a451703cc1122dfd72b04a3bf43904c88a668fcd9bd21ccc80e27006f734a276d3551af92a6c8bb33c1");

