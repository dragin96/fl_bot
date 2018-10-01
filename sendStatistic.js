const sendMail = require('./sendmail.js').sendMail;

module.exports.sendStatistic = async function (Mongo, statistic){

      const time_for = process.env.time_for_statistic || 17;
      const is_need_time = new Date().getHours() == time_for;
      const is_already_send = new Date() - statistic.send_date < 1440 * 1000 * 60;
      if(is_already_send || !is_need_time){
        console.log('еще не время отсылать уведомление');
        return;
      }
      let wrong_reqs = statistic.getWrongReq();
  
      let students = await Mongo.getAllStudents();
      
      let classes = {};
      let subjects = {};
      for(let student of students){
        if(!classes[student.class_lvl]){
          classes[student.class_lvl]=1;
        } else {
          classes[student.class_lvl]++;
        }
        
        for(let subject in student.statistic){
          if(!subjects[subject]){
            subjects[subject]=student.statistic[subject];
          } else {
            subjects[subject]+=student.statistic[subject];
          }
        }
      }
    
      let old_classes = statistic.getClasses();
      let old_subjects = statistic.getSubjects();
      await statistic.sendStatistic(classes, subjects).catch(console.error);
  
      
  
      if(old_classes){
        for(let old_class in old_classes){
          if(classes[old_class]){
            classes[old_class]-=old_classes[old_class];
          }
        }
      }
      
      if(old_subjects){
        for(let old_subject in old_subjects){
          if(subjects[old_subject]){
            subjects[old_subject]-=old_subjects[old_subject];
          }
        }
      }
      let str = '';
      str+='Статистика по классам за 24 часа: \n';
      for(let class_lvl in classes){
        str+=`${class_lvl}: ${classes[class_lvl]}; \n`;
      }
      str+='\n';
      str+='Статистика по предметам за 24 часа: \n';
  
      for(let subject in subjects){
        str+=`${subject}: ${subjects[subject]}; \n`;
      }
  
      str+='\n\r';
      str+='Статистика по неверным запросам за 24 часа: \n';
      
      for(let req of wrong_reqs){
        str+=`${req.vk_id} | ${req.first_name} | ${req.class_lvl? req.class_lvl : '-'} | ${req.subject? req.subject : '-'} | ${req.author? req.author : '-'} | ${req.parts} | ${req.message}\n\r`;
      }
      

      console.log('str', str);
      sendMail(str);
      console.log('статистика отправлена');
};