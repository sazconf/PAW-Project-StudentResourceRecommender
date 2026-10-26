const express = require('express');
const {
  renderHomePage,
  renderResourcesPage,
  renderHistoryPage
} = require('../controllers/webController');

const router = express.Router();

router.get('/', renderHomePage);
router.get('/resources', renderResourcesPage);
router.get('/find-resources', renderResourcesPage);
router.get('/history', renderHistoryPage);

module.exports = router;
