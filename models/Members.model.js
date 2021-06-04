const mongoose = require('mongoose');

const member = new mongoose.Schema({
    date: {
        type: Number,
        required: true
    },
    memberName: {
        type: String,
        required: true
    },
    tagId: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('members', member);