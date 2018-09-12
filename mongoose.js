const mongoose = module.exports.mongoose = require('mongoose');
//mongoose.connect('mongodb://127.0.0.1:27017/bestmafia', {

//mongoose.connect('mongodb://${process.env.db_login}:${process.env.db_password}@127.0.0.1:27017/bestmafia');

const options = {
    useNewUrlParser: true,
    autoIndex: true, // Don't build indexes
    reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
    reconnectInterval: 500, // Reconnect every 500ms
    poolSize: 10, // Maintain up to 10 socket connections
    // If not connected, return errors immediately rather than waiting for reconnect
    bufferMaxEntries: 0,
    connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    family: 4, // Use IPv4, skip trying IPv6
};

mongoose.set('useCreateIndex', true);
mongoose.connect('mongodb://127.0.0.1:27017/gdz', options);
var db = module.exports.db = mongoose.connection;
db.on('error', function (err) {
    console.error('connection error:', err.message);
});

let Student;
let logger;
/*Для лога*/
module.exports.setLogger = function (_logger) {
    logger = _logger;
};
module.exports.setStudent = function (_student) {
    Student = _student;
};


const Mongo = module.exports.Mongo = {
    getStudentById: (id) => {
        return new Promise((resolve, reject) => {
            Student.findOne({
                _id: id
            }, (err, student) => {
                if (student === null) return reject("last student is empty");
                if (err) return reject(err);
                resolve(student);
            });
        });
    },
    saveStudent: (student) => {
        return new Promise((resolve) => {
            student.save(function (err) {
                if (err) {
                    logger.error(err);
                    return resolve();
                }
                logger.info("mongoose.js >> successfull save");
                resolve();
            });
        });
    },
    //Создаем студент
    initStudent: async (id, class_lvl) => {
        let student = await Mongo.getStudentById(id).catch(logger.info);
        if (student) {
            return logger.info("mongoose.js >> Невозможно создать, уже существует");
        }
        let new_student = new Student({
            _id: id,
            class_lvl: class_lvl,
        });
        Mongo.saveStudent(new_student);
    }
};
db.once('open', function callback() {
    logger.info("mongoose.js >> Connected to DB!");
});