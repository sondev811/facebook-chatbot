const mongoose = require('mongoose');

const special_date = new mongoose.Schema({
    date: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('special_date', special_date, 'special_date');