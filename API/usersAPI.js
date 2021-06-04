const express = require('express');
const router = express.Router();
const users = require('../models/Users.model');

router.get('/', (req, res) => {
    res.send('Hello users');
})
router.post('/', async (req, res) => {
    const { firstName, lastName } = req.body;
    let user = { firstName, lastName };
    let userModel = new users(user);
    await userModel.save();
    res.json(userModel);
});

module.exports = router;