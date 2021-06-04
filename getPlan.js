const connectDB = require('./DB/connection');
const PlanService = require('./services/plan');
const planService = new PlanService();

class Plans {
    constructor() {
    }
    async getPlan() {
        try {
            await connectDB();
            const date = new Date();
            const today = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
            const plan = await planService.getPlan();
            let name = '';
            plan.map(item => {
                if (item.date === today) {
                    name = item.name;
                }
            });
            return name = '' ? `Hôm nay không có lịch đổ rác.` : `Hôm nay ${name} sẽ đổ rác nhé.`;
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
