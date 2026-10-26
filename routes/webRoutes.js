const express = require('express');
const { renderHomePage } = require('../controllers/webController');

const router = express.Router();

router.get('/', renderHomePage);

module.exports = router;
