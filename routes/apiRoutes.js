const express = require('express');
const {
  getStatus,
  getProducts,
  getPersonalizedRecommendations
} = require('../controllers/apiController');

const router = express.Router();

router.get('/status', getStatus);
router.get('/produk', getProducts);
router.post('/recommendations', getPersonalizedRecommendations);

module.exports = router;
