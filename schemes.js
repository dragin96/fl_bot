var mongoose = require('./mongoose.js').mongoose;
var db = require('./mongoose.js').db;


var studentSchema = mongoose.Schema({
    vk_id: {
        type: Number,
        index: {
            unique: true,
            dropDups: true,
            index: true,
        }
    },
    class_lvl: {
        type: Number
    },
    name: {
        type: String,
        required: true
    },
    reg_date: {
        type: Date,
        default: Date.now
    },
    statistic: mongoose.Schema.Types.Mixed
});

studentSchema.methods.changeClass = function (new_class) {
    this.class_lvl = new_class;
    this.save();
};
studentSchema.methods.getStatistic = function () {
    return this.statistic;
};

studentSchema.methods.saveStatistic = function (subject) {
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

studentSchema.methods.IsInitState = function () {
    return this.state === 'init';
};
studentSchema.methods.IsClosedState = function () {
    return this.state === 'closed';
};

module.exports.Student = db.model('Student', studentSchema);