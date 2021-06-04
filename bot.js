const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

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

let cronJob = null;
const startCronJobSendMessage = (api, threadID, hour, minutes) => {
    if(cronJob) {
        cronJob.stop();
    }
    const timeStart = `0 ${minutes} ${hour} * * *`;
    // 0 * /5 * * * * every 5m
    cronJob = cron.schedule(timeStart, async() => {
        console.log('checking plan')
        const message = await plans.getPlanCron();
        if(message) {
            api.sendMessage(message, threadID);
        }
    });
    let timePlan = timeStart.split('*').join('');
    timePlan = timePlan.split(' ');
    return `Cài đặt thông báo thành công. Lịch đổ rác sẽ được thông báo vào ${timePlan[2]}:${timePlan[1]} hằng ngày.`;
}

let notifySetup = false;

app.listen(port, () => {
    console.log(`App started at ${port}`);
});

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
                    api.sendMessage('Oke. Đang kiểm tra lịch đổ rác...', event.threadID);
                    if(question.includes('mai')) {
                        answer = await plans.getPlan('tomorrow');
                    } else if(question.includes('qua')) {
                        answer = await plans.getPlan('yesterday');
                    } else if(question.includes('nay')){
                        answer = await plans.getPlan('today');
                    }
                } else if(
                    question.includes('ok') || 
                    question.includes('oke') || 
                    question.includes('cảm') || 
                    question.includes('cảm ơn') ||
                    question.includes('thanks') ||
                    question.includes('thank you')
                ) {
                    answer = 'Oke. Không có gì.';
                } else if(question.includes('helpadvance')) {
                    answer += 'Chat bot tự động trả lời. Đây là các lệnh mà tôi hỗ trợ nâng cao: cài đặt thông báo, update plans, reset plans.';
                } else if(question.includes('help')) {
                    answer += '----- Room 1c ----- \n';
                    answer += 'Chat bot tự động trả lời. Đây là các lệnh mà tôi hỗ trợ: \n';
                    answer += '+ rác hoặc rac: Tôi sẽ trả lời cho bạn hôm nay ai đổ rác. \n';
                    answer += '+ xem thời tiết(hoặc xem thoi tiet) + tên thành phố(không dấu): Tôi sẽ trả lời cho bạn thời tiết hôm nay của thành phố bạn chọn. Nếu không nhập tên, mặc định sẽ lấy TPHCM. \n';
                    answer += '+ sleep hoặc sleepy: Tôi sẽ dựa vào chu kì giấc ngủ để khuyên bạn nên tỉnh giấc vào thời gian nào mà bạn sẽ cảm thấy tỉnh táo và minh mẫn.\n';
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
                } else if(question.includes('cài đặt thông báo')) {
                    api.sendMessage('Xác nhận cài đặt thông báo. Nhập giờ với cú pháp /bot cài đặt giờ hh:mm', event.threadID);
                    notifySetup = true;
                } else if(question.includes('cài đặt giờ') && notifySetup) {
                    let timePlan = question.split(' ');
                    let time = timePlan[timePlan.length - 1];
                    let timeSplit = time.split(':');
                    answer = startCronJobSendMessage(api, event.threadID, timeSplit[0], timeSplit[1]);
                } else if(question.includes('xem thời tiết') || question.includes('xem thoi tiet')) {
                    let city = question.replace('/bot xem thoi tiet','');
                    city = city.replace('/bot xem thời tiết','');
                    if(city === '') {
                        answer = await weather.getWeather('Ho Chi Minh');
                    } else {
                        answer = await weather.getWeather(city.trim());
                    }
                } 
                 else if(
                    question.includes('thời') ||
                    question.includes('tiết') ||
                    question.includes('thoi') ||
                    question.includes('tiet')
                ) {
                    answer = await weather.getWeather('Ho Chi Minh');
                } else if(question.includes('phòng ai hiền nhất')) {
                    answer = 'A Sơn chứ ai.';
                } else if(
                    question.includes('nay ngày nhiêu') || 
                    question.includes('ngày bao nhiêu') || 
                    question.includes('nay ngày') ||
                    question.includes('ngày nhiêu')
                    ) {
                    const date = new Date();
                    answer = `Hôm nay là ngày ${date.getDay()}/${date.getMonth() + 1}/${date.getFullYear()}`;
                } else if(
                    question.includes('mấy giờ') || 
                    question.includes('bây giờ là mấy giờ')) {
                    const date = new Date();
                    answer = `Bây giờ là ${date.getHours()}:${date.getMinutes()}`;
                } else if(question.includes('cùi bắp')) {
                    answer = `Dỗi luôn...`;
                } else {
                    answer = 'Không hiểu câu lệnh. Sử dụng /bot help để xem lệnh bot có thể hỗ trợ.';
                }
                api.sendMessage(answer, event.threadID);
                break;
            case 'event':
                console.log(event);
                break;
        }
    });
});

app.get('*', (req, res) => {
    res.send('This is chatbot.');
})

var http = require("http");
setInterval(function() {
    http.get("http://chatbot1croom.herokuapp.com");
}, 300000); // every 5 minutes (300000)
