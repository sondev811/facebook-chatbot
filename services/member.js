const members = require('../models/Members.model');

class Member {

    async getMember() {
        return await members.find();
    }

    async updateMember() {
        let memberModel = new members(member);
        await memberModel.save();
    }
}

module.exports = Member;
