const express = require('express');
const { getStatus, getProducts } = require('../controllers/apiController');

const router = express.Router();

router.get('/status', getStatus);
router.get('/produk', getProducts);

module.exports = router;
