const connectDB = require('./DB/connection');
const PlanService = require('./services/plan');
const planService = new PlanService();

class Plans {
    constructor() {
    }
    async getPlan(type) {
        try {
            await connectDB();
            const date = new Date();
            const yesterday = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate() - 1}`;
            const today = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
            const tomorrow = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate() + 1}`;
            let day = today;
            let nameDay = 'Hôm nay';
            if(type === 'yesterday') {
                nameDay = 'Hôm qua';
                day = yesterday;
            } else if(type === 'tomorrow') {
                nameDay = 'Ngày mai';
                day = tomorrow;
            }
            const plan = await planService.getPlan();
            let name = '';
            plan.map(item => {
                console.log(item.date);
                console.log(day);
                if (item.date === day) {
                    name = item.name;
                }
            });
            return name ? `${nameDay} ${name} sẽ đổ rác.` :  `${nameDay} không có ai đổ rác.`;
        } catch (err) {
            console.error('Login or send message error', err);
        }
    }

    async getPlanCron() {
        try {
            await connectDB();
            const date = new Date();
            const today = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
            const plan = await planService.getPlan();
            let message = '';
            plan.map(item => {
                if (item.date === today) {
                    message = `Thông báo lịch đổ rác: Hôm nay ${item.name} sẽ đổ rác nhé.`;
                }
            });
            return message;
        } catch (err) {
            console.error('Login or send message error', err);
        }
    }
 }

 module.exports = Plans;
