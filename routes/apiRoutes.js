const express = require('express');
const {
  getStatus,
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  getPersonalizedRecommendations,
  getProducts
} = require('../controllers/apiController');

const router = express.Router();

// Health check
router.get('/status', getStatus);

// Resource REST API (CRUD operations)
router.get('/resources', getAllResources);
router.get('/resources/:id', getResourceById);
router.post('/resources', createResource);
router.put('/resources/:id', updateResource);
router.delete('/resources/:id', deleteResource);

// Backward-compatible alias
router.get('/produk', getProducts);

// Recommendations endpoint
router.post('/recommendations', getPersonalizedRecommendations);

module.exports = router;
