const moment = require("moment");
const connectDB = require('./DB/connection');
const express = require('express');
const Member = require('./services/member');
const plan = require('./models/Plan.model');
const memberModel = require('./models/Members.model');
const { find } = require("./models/Members.model");
const app = express();
app.use(express.json({ extended: false }));
const day = 31;
const b = 14;

const member = new Member();
const userInit = [
    { memberName: "Tuệ", date: 2, tagId: '100004271522212' },
    { memberName: "Huyền", date: 4, tagId: '100008293159860' },
    { memberName: "Kim Anh", date: 6, tagId: '100009048649001' },
    { memberName: "Anh", date: 8, tagId: '100025238034029' },
    { memberName: "Sơn", date: 10, tagId: '100004369663896' },
    { memberName: "Cường", date: 12, tagId: '100007535357078' },
    { memberName: "Quỳnh", date: 14, tagId: '100009188398529' },
];

class Calc {
    constructor() {
        this.members = [];
        this.memberHandle = [];
    }

    async getMember() {
        try {
            const data = []
            const arr = await member.getMember();
            arr.map(item => {
                data.push({ memberName: item.memberName, date: item.date, tagId: item.tagId });
            });
            return data;
        } catch (error) {
            members = [];
            console.log(error);
        }
    }

    mergeMember(day, arr) {
        const result = arr.find((item) => day === item.date || day === item.date + b) // b is date of total member
        return result;
    };

    calcDay(arr) {
        const data = [];
        for (let i = 1; i <= day; i++) {
            if (i % 2 === 0) {
                if(this.mergeMember(i, arr) && this.mergeMember(i, arr).memberName) {
                    data.push({
                        name: this.mergeMember(i, arr).memberName ? this.mergeMember(i, arr).memberName : null,
                        date: i,
                        tagId: this.mergeMember(i, arr).tagId
                    });
                }
            }
        }

        return data;
    };

    handleUpdate(arr) {
        const arrSorted = arr.sort((a, b) => a.date - b.date);
        const endOfArray = arrSorted[arrSorted.length - 1];
        const firstOfArray = arrSorted[0];
        arrSorted[0] = endOfArray;
        for (let i = arrSorted.length; i > 0; i--) {
            if (i > 1) {
                arrSorted[i] = arrSorted[i - 1];
            }
        }
        arrSorted[1] = firstOfArray;
        arrSorted.length--;
        arrSorted.forEach((item, index) => {
            if (index === 0) {
                item.date = 2;
            } else {
                item.date += 2;
            }
        });
        return arrSorted;
    };

    async saveMember(arr) {
        arr.map(item => {
            let mem = new memberModel(item);
            mem.save((error, item) => {
                if (error) console.log('Save mem fail', error);
                console.log(`Save ${mem} success`);
            });
        })
    }

    async updateMember() {
        const members = await this.getMember();
        await this.deleteMember();
        const data = this.handleUpdate(members);
        this.saveMember(data);
    }

    async deleteMember() {
        await memberModel.deleteMany();
    }

    async savePlan(arr) {
        const currenMonth = moment().format('M');
        const currenYear = moment().format('Y');
        const handleData = [];
        arr.forEach(item => {
            const date = `${currenYear}-${currenMonth}-${item.date}`;
            handleData.push({ name: item.name, date, tagId: item.tagId });
        });
        handleData.push({ name: handleData[0].name, date: `${currenYear}-${currenMonth}-30`, tagId: handleData[0].tagId }); // add fisrt plan to last day of month
        handleData.map(item => {
            let planModel = new plan(item);
            planModel.save((error, item) => {
                if (error) console.log('Save plan fail', error);
                console.log(`Save ${planModel} success`);
            });
        })
    }

    async deletePlan() {
        await plan.deleteMany();
    }

    async initData() {  //reset data
        await connectDB();
        await this.deleteMember();
        await this.deletePlan();
        console.log('Deleted plans');
        await this.saveMember(userInit);
        this.savePlan(this.calcDay(userInit));
    }

    async init() { //run every first day of month
        await connectDB();
        await this.updateMember();
        const data = await this.getMember();
        console.log(data);
        await this.deletePlan();
        console.log('Deleted plans');
        this.savePlan(this.calcDay(data));
    }
}

module.exports = Calc;

// calc.init(); //run every first day of month
// // calc.initData();
