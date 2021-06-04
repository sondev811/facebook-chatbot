const mongoose = require('mongoose');

const plan = new mongoose.Schema({
    date: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    tagId: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('plan', plan);