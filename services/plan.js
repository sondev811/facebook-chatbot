const planModel = require('../models/Plan.model');

class Plan {

    async getPlan() {
        return await planModel.find();
    }

}

module.exports = Plan;
