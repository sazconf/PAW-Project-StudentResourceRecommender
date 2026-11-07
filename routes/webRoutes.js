const express = require('express');
const {
  renderHomePage,
  renderResourcesPage,
  renderHistoryPage,
  renderManagePage
} = require('../controllers/webController');

const router = express.Router();

router.get('/', renderHomePage);
router.get('/resources', renderResourcesPage);
router.get('/find-resources', renderResourcesPage);
router.get('/history', renderHistoryPage);
router.get('/manage', renderManagePage);
router.get('/manage-resources', renderManagePage);

module.exports = router;
