const login = require("facebook-chat-api");
const fs = require('fs');
const credential = { appState: JSON.parse(fs.readFileSync('./cookies.json', 'utf-8')) }
const Plans = require('./getPlan');
let plans = new Plans();
const Calc = require('./calc');
let calc = new Calc();
const Weather = require('./weather');
let weather = new Weather();
const cron = require('node-cron');
let cronJob = null;
let notifySetup = false;

const calcSleepCycle = (cycle) => {
    const date = new Date();
    const timeInSecs = date.getTime();
    return new Date(timeInSecs + (cycle * 90 + 14) * 60 * 1000);
};

const getTimeSleepCycle = () => {
    const date = new Date();
    let message = `Bây giờ là ${date.getHours()}:${date.getMinutes()} ${formatAMPM(date)}. Nếu bạn đi ngủ ngay bây giờ, bạn nên cố gắng thức dậy vào một trong những thời điểm sau: `;
    for(let i = 1; i <= 5; i++) {
        let time = calcSleepCycle(i); 
        const minutes = time.getMinutes() >= 10 ? time.getMinutes() : `0${time.getMinutes()}`;
        const ampm = formatAMPM(time);
        message += `${time.getHours()}:${minutes} ${ampm}`;
        if(i == 5) {
            message += '.';
            break;
        }
            message += ' hoặc ';
    }
    return message;
};

const formatAMPM = (time) => {
    let hours = time.getHours();
    let ampm = 'sáng';
    if(hours > 12 && hours < 18) {
        ampm = 'chiều';
    } else if(hours >= 18 && hours <= 23) {
        ampm = 'tối';
    }
    return ampm;
}

const startCronJobSendMessage = (api, hour, minutes) => {
    if(cronJob) {
        cronJob.stop();
    }
    const timeStart = `0 ${minutes} ${hour} * * *`;
    const threadID = '4574674289264045';
    // const threadID = '100016821697155';
    
    // 0 * /5 * * * * every 5m
    cronJob = cron.schedule(timeStart, async() => {
        console.log('Checking plan...')
        const message = await plans.getPlanCron();
        console.log(message);
        if(message) {
            api.sendMessage(message, threadID);
            console.log('Sent plan!!!');
        }
    });
    let timePlan = timeStart.split('*').join('');
    timePlan = timePlan.split(' ');
    return `Cài đặt thông báo thành công với nhóm ${threadID}. Lịch đổ rác sẽ được thông báo vào ${timePlan[2]}:${timePlan[1]} hằng ngày.`;
}

const trash = async (question) => {
    if(question.includes('mai')) {
       return await plans.getPlan('tomorrow');
    } else if(question.includes('qua')) {
        return await plans.getPlan('yesterday');
    } 
    return await plans.getPlan('today');
}

const botHelp = () => {
    let answer = '----- Room 1c ----- \n';
    answer += 'Chat bot tự động trả lời. Đây là các lệnh mà tôi hỗ trợ: \n';
    answer += '+ "/bot + (nay, mai, qua) + (rác hoặc rac)": Tôi sẽ trả lời cho bạn lịch đổ rác tương ứng. \n';
    answer += '+ "/bot giờ" hoặc "/bot + câu hỏi chứa từ giờ": Tôi sẽ trả lời cho bạn bây giờ là mấy giờ. \n';
    answer += '+ "/bot ngày" hoặc "/bot + câu hỏi chứa từ ngày": Tôi sẽ trả lời cho bạn nay là ngày bao nhiêu. \n';
    answer += '+ "/bot thời tiết" hoặc "/bot thoi tiet": Tôi sẽ trả lời cho bạn thời tiết hôm nay của TP HCM. \n';
    answer += '+ "/bot xem thời tiết" hoặc "/bot xem thoi tiet + tên thành phố(không dấu)": Tôi sẽ trả lời cho bạn thời tiết hôm nay của thành phố bạn chọn. \n';
    answer += '+ "/bot sleep" hoặc "/bot sleepy": Tôi sẽ dựa vào chu kì giấc ngủ để khuyên bạn nên tỉnh giấc vào thời gian nào mà bạn sẽ cảm thấy tỉnh táo và minh mẫn. \n';
    return answer;
}

login(credential, (err, api) => {
    if(err) return console.error(err);
    api.setOptions({listenEvents: true});
    api.listenMqtt(async (err, event) => {
        if(err) return console.error(err);
        switch(event.type) {
            case 'message':
                if(!event.body || !event.body.includes('/bot')) {
                    return;
                }
                api.markAsRead(event.threadID, (err) => {
                    if(err) console.log(err);
                });
                console.log(event);
                let answer = '';
                const question = event.body.toLowerCase();
                if(question.includes('rác') || question.includes('rac')) {
                    api.sendMessage('Đang kiểm tra lịch đổ rác...', event.threadID);
                    answer = await trash(question);
                } else if(question.includes('helpadvance')) {
                    answer += 'Chat bot tự động trả lời. Đây là các lệnh mà tôi hỗ trợ nâng cao: cài đặt thông báo, update plans, reset plans.';
                } else if(question.includes('help')) {
                    answer = botHelp();
                } else if(question.includes('sleep') || question.includes('sleepy')) {
                    answer = getTimeSleepCycle();
                } else if(question.includes('update plans')) {
                    api.sendMessage('Oke. Đang tiến hành cập nhật lại kế hoạch đổ rác.', event.threadID);
                    await calc.init();
                    answer = 'Cập nhật lịch đổ rác thành công. Xem lịch đổ rác của tháng mới ở https://room1c.herokuapp.com/management';
                } else if(question.includes('reset plans')) {
                    api.sendMessage('Oke. Đang tiến hành cập nhật lại kế hoạch đổ rác.', event.threadID);
                    await calc.init();
                    answer = 'Cập nhật lịch đổ rác thành công. Xem lịch đổ rác của tháng mới ở https://room1c.herokuapp.com/management';
                } else if(question.includes('cài đặt giờ')) {
                    let timePlan = question.split(' ');
                    let time = timePlan[timePlan.length - 1];
                    let timeSplit = time.split(':');
                    answer = startCronJobSendMessage(api, timeSplit[0], timeSplit[1]);
                } else if(question.includes('xem thời tiết') || question.includes('xem thoi tiet')) {
                    let city = question.replace('/bot xem thoi tiet','');
                    city = city.replace('/bot xem thời tiết','');
                    if(city === '') {
                        answer = await weather.getWeather('Ho Chi Minh');
                    } else {
                        answer = await weather.getWeather(city.trim());
                    }
                } else if(
                    question.includes('thời') ||
                    question.includes('tiết') ||
                    question.includes('thoi') ||
                    question.includes('tiet')
                ) {
                    answer = await weather.getWeather('Ho Chi Minh');
                } else if(question.includes('ngày')){
                    const date = new Date();
                    answer = `Hôm nay là ngày ${date.getDay()}/${date.getMonth() + 1}/${date.getFullYear()}`;
                } else if(question.includes('giờ')) {
                    const date = new Date();
                    answer = `Bây giờ là ${date.getHours()}:${date.getMinutes()}`;
                } else if(question.includes('cùi bắp') || question.includes('ngu')) {
                    answer = `Dỗi luôn...`;
                } else {
                    answer = 'Bot không hiểu câu lệnh. Sử dụng lệnh "/bot help" để xem các lệnh bot có thể hỗ trợ.';
                }
                api.sendMessage(answer, event.threadID);
                break;
            case 'event':
                console.log(event);
                break;
        }
    });
});

