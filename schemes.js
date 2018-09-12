
var mongoose = require('./mongoose.js').mongoose;
var db=require('./mongoose.js').db;
let logger;
/*Для лога*/
module.exports.setLogger=function(_logger){
	logger=_logger;
};

var studentSchema = mongoose.Schema({
    id: {
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
    reg_date: {
        type: Date,
        default: Date.now
    },
    statistic: []
});



studentSchema.methods.IsInitState = function () {
    return this.state === 'init';
};
studentSchema.methods.IsClosedState = function () {
    return this.state === 'closed';
};

module.exports.Student = db.model("Student", studentSchema);