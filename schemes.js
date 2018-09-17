
var mongoose = require('./mongoose.js').mongoose;
var db=require('./mongoose.js').db;


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
    statistic: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    }
});

studentSchema.methods.changeClass = function (new_class) {
    this.class_lvl = new_class;
};

studentSchema.methods.saveStatistic = function (subject) {
    console.log("SAVE STATISCIKS", subject, this.statistic);
    if(!this.statistic){
        this.statistic = {};
    }
    console.log("this.statistic", this.statistic);
    if(this.statistic[subject] === undefined) {
        this.statistic[subject] = 1;
    } else {
        this.statistic[subject]++;
    }
    console.log("this.statistic", this.statistic);
};

studentSchema.methods.saveStatistic = function (subject) {
    console.log("SAVE STATISCIKS", subject);
    if(this.statistic[subject] === undefined) {
        this.statistic[subject] = 1;
    } else {
        this.statistic[subject]++;
    }
};
studentSchema.methods.IsInitState = function () {
    return this.state === 'init';
};
studentSchema.methods.IsClosedState = function () {
    return this.state === 'closed';
};

module.exports.Student = db.model("Student", studentSchema);