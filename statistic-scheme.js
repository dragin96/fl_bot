var mongoose = require('./mongoose.js').mongoose;
var db = require('./mongoose.js').db;


var statisticSchema = mongoose.Schema({
    send_date: {
        type: Date
    },
    classes: mongoose.Schema.Types.Mixed,
    subjects: mongoose.Schema.Types.Mixed,
    wrong_reqs: [{
        date: Date,
        first_name: String,
        vk_id: Number,
        class_lvl: Number,
        subject: String,
        author: String,
        parts: Array,
        message: String
    }]
});
statisticSchema.methods.getClasses = function () {
    return this.classes;
};
statisticSchema.methods.getSubjects = function () {
    return this.subjects;
};
statisticSchema.methods.sendStatistic = function (classes, subjects) {
    return new Promise((resolve, reject) => {
        this.send_date = new Date();
        this.classes = classes;
        this.subjects = subjects;
        this.markModified('classes');
        this.markModified('subjects');
        this.save(function (err) {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
};

statisticSchema.methods.getWrongReq = function () {
    let res = [];
    for (let req of this.wrong_reqs) {
        if (req.date > this.send_date) {
            res.push(req);
        }
    }
    return res;
};
statisticSchema.methods.saveWrongReq = function (req) {
    console.log('save wrong req', req);
    this.wrong_reqs.push({
        date: new Date(),
        first_name: req.first_name,
        vk_id: req.vk_id,
        class_lvl: req.class_lvl,
        subject: req.subject,
        author: req.author,
        parts: req.parts,
        message: req.message,
    });

};

statisticSchema.methods.saveWrongReqForInterval = function (req) {
    this.markModified('wrong_reqs');
    this.save();
};



statisticSchema.methods.getStatistic = function () {
    return this.statistic;
};

statisticSchema.methods.saveStatistic = function (subject) {
    if (!this.statistic) {
        this.statistic = {};
    }
    if (this.statistic[subject] === undefined) {
        this.statistic[subject] = 1;
    } else {
        this.statistic[subject]++;
    }
    this.markModified('statistic');
    this.save();
};


module.exports.Statistic = db.model('Statistic', statisticSchema);