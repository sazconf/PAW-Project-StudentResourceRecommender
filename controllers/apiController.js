const {
  getRecommendations,
  getSampleResources
} = require('../utils/recommendationService');

function getStatus(request, response) {
  response.json({
    status: 'ok',
    message: 'SSR API is running'
  });
}

function getProducts(request, response) {
  // Temporary fictional records for the Week 7 foundation; no database is used yet.
  response.json(getSampleResources());
}

function getPersonalizedRecommendations(request, response) {
  const history = request.body && request.body.history;

  if (history !== undefined && !Array.isArray(history)) {
    return response.status(400).json({
      status: 'error',
      message: 'history must be an array'
    });
  }

  if (Array.isArray(history) && history.length > 20) {
    return response.status(400).json({
      status: 'error',
      message: 'history may contain at most 20 searches'
    });
  }

  const recommendations = getRecommendations(Array.isArray(history) ? history : []);

  return response.json({
    status: 'ok',
    personalized: Array.isArray(history) && history.length > 0,
    source: 'temporary-sample-data',
    recommendations
  });
}

module.exports = {
  getStatus,
  getProducts,
  getPersonalizedRecommendations
};
