const express = require('express');
const router = express.Router();
const members = require('../models/Members.model');

router.get('/', (req, res) => {
    members.find((error, item) => {
        const response = {
            result: item,
            message: null,
            status: 200
        }
        if (error) {
            response['status'] = 400;
            response['result'] = err
            res.status(400).json(response)
        } else {
            response['status'] = 200;
            res.status(200).json(response);
        }
    });
})

router.post('/', async (req, res) => {
    const { date, name } = req.body;
    let member = { date, name };
    let memberModel = new members(member);
    await memberModel.save();
    res.json(memberModel);
});

module.exports = router;