const WolframAlphaAPI = require('wolfram-alpha-api');
const waApi = WolframAlphaAPI('TGPKXJ-5UL26LJTVH');

function culculator(str) {
    return new Promise(async (resolve) => {
        const el = await waApi.getShort(str);
        return resolve(el);
    })
}

exports.culculator = culculator;
// (async () => {
//     let rez = await culculator("1+10-100");
//     console.log(rez);
    
// })();