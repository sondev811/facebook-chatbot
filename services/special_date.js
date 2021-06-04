const specialDate = require('../models/Special_Date.model');

class SpecialDate {

    async getSpecialDate() {
        return await specialDate.find();
    }

}

module.exports = SpecialDate;
