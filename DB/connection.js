const mongoose = require('mongoose');
require('dotenv/config');
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DATABASE, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('-------------Connected to DB success-------------');
        console.log('Server: http://localhost:9999/');
    } catch (error) {
        console.log(error);
    }
};

module.exports = connectDB;
