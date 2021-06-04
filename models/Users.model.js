const mongoose = require('mongoose');
const users = new mongoose.Schema({
	userName: {
		type: String
	},
	gmail: {
		type: String
	},
	password: {
		type: String
	},
	firstName: {
		type: String
	},
	lastName: {
		type: String
	},
	phone: {
		type: String
	},
	address: {
		type: String
	},
	position: {
		type: String
	},
	remember_token: {
		type: String
	}
});

module.exports = mongoose.model('users', users);
