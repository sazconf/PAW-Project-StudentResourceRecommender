const ResourceModel = require('../models/resourceModel');
const { testConnection } = require('../config/db');
const {
  getRecommendations,
  getSampleResources
} = require('../utils/recommendationService');

const ALLOWED_DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];
const ALLOWED_RESOURCE_TYPES = [
  'Video Tutorial',
  'Article / Guide',
  'Interactive Lab',
  'Documentation',
  'Book / eBook',
  'Course'
];

/**
 * Validate resource payload.
 * @param {Object} body
 * @returns {string[]} Array of validation error messages.
 */
function validateResourcePayload(body) {
  const errors = [];
  const { title, subject, keyword, difficulty, resource_type, url } = body || {};

  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.push('Title is required and must be non-empty.');
  } else if (title.trim().length > 255) {
    errors.push('Title must be at most 255 characters.');
  }

  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    errors.push('Subject is required and must be non-empty.');
  } else if (subject.trim().length > 100) {
    errors.push('Subject must be at most 100 characters.');
  }

  if (!keyword || typeof keyword !== 'string' || !keyword.trim()) {
    errors.push('Keyword / topic is required.');
  } else if (keyword.trim().length > 255) {
    errors.push('Keyword must be at most 255 characters.');
  }

  if (!difficulty || typeof difficulty !== 'string' || !difficulty.trim()) {
    errors.push('Difficulty is required.');
  } else {
    const matchesDifficulty = ALLOWED_DIFFICULTIES.some(
      (d) => d.toLowerCase() === difficulty.trim().toLowerCase()
    );
    if (!matchesDifficulty) {
      errors.push(`Difficulty must be one of: ${ALLOWED_DIFFICULTIES.join(', ')}.`);
    }
  }

  if (!resource_type || typeof resource_type !== 'string' || !resource_type.trim()) {
    errors.push('Resource type is required.');
  }

  if (!url || typeof url !== 'string' || !url.trim()) {
    errors.push('Resource URL is required.');
  } else {
    const trimmedUrl = url.trim();
    if (!/^https?:\/\/.+/i.test(trimmedUrl)) {
      errors.push('Resource URL must be a valid HTTP or HTTPS address.');
    }
  }

  return errors;
}

/**
 * GET /api/status
 * Health check & database connection probe.
 */
async function getStatus(request, response, next) {
  try {
    const dbStatus = await testConnection();
    response.json({
      status: 'ok',
      service: 'Smart Student Resource Recommender (SSR) API',
      timestamp: new Date().toISOString(),
      database: dbStatus
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/resources
 * Retrieve all resources from PostgreSQL with optional query filtering.
 */
async function getAllResources(request, response, next) {
  try {
    const { subject, keyword, difficulty, sort } = request.query;
    const resources = await ResourceModel.findAll({ subject, keyword, difficulty, sort });
    return response.json(resources);
  } catch (error) {
    console.error('Error fetching resources from PostgreSQL:', error.message);
    // If DB has temporary issue, fall back to sample resources so app remains resilient
    try {
      const fallback = getSampleResources();
      return response.json(fallback);
    } catch {
      return next(error);
    }
  }
}

/**
 * GET /api/resources/:id
 * Retrieve a single resource by ID.
 */
async function getResourceById(request, response, next) {
  try {
    const id = parseInt(request.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return response.status(400).json({
        status: 'error',
        message: 'Invalid resource ID. Must be a positive integer.'
      });
    }

    const resource = await ResourceModel.findById(id);
    if (!resource) {
      return response.status(404).json({
        status: 'error',
        message: `Resource with ID ${id} was not found.`
      });
    }

    return response.json(resource);
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/resources
 * Create a new learning resource in PostgreSQL.
 */
async function createResource(request, response, next) {
  try {
    const errors = validateResourcePayload(request.body);
    if (errors.length > 0) {
      return response.status(400).json({
        status: 'error',
        message: 'Validation failed.',
        errors
      });
    }

    const { title, subject, keyword, difficulty, resource_type, description, url } = request.body;

    // Standardize difficulty capitalization
    const matchedDifficulty =
      ALLOWED_DIFFICULTIES.find(
        (d) => d.toLowerCase() === difficulty.trim().toLowerCase()
      ) || difficulty.trim();

    const created = await ResourceModel.create({
      title,
      subject,
      keyword,
      difficulty: matchedDifficulty,
      resource_type: resource_type.trim(),
      description: description || '',
      url: url.trim()
    });

    return response.status(201).json({
      status: 'success',
      message: 'Resource created successfully.',
      data: created
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * PUT /api/resources/:id
 * Update an existing learning resource in PostgreSQL.
 */
async function updateResource(request, response, next) {
  try {
    const id = parseInt(request.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return response.status(400).json({
        status: 'error',
        message: 'Invalid resource ID. Must be a positive integer.'
      });
    }

    const existing = await ResourceModel.findById(id);
    if (!existing) {
      return response.status(404).json({
        status: 'error',
        message: `Resource with ID ${id} was not found.`
      });
    }

    const errors = validateResourcePayload(request.body);
    if (errors.length > 0) {
      return response.status(400).json({
        status: 'error',
        message: 'Validation failed.',
        errors
      });
    }

    const { title, subject, keyword, difficulty, resource_type, description, url } = request.body;

    const matchedDifficulty =
      ALLOWED_DIFFICULTIES.find(
        (d) => d.toLowerCase() === difficulty.trim().toLowerCase()
      ) || difficulty.trim();

    const updated = await ResourceModel.update(id, {
      title,
      subject,
      keyword,
      difficulty: matchedDifficulty,
      resource_type: resource_type.trim(),
      description: description || '',
      url: url.trim()
    });

    return response.json({
      status: 'success',
      message: 'Resource updated successfully.',
      data: updated
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /api/resources/:id
 * Delete a learning resource from PostgreSQL.
 */
async function deleteResource(request, response, next) {
  try {
    const id = parseInt(request.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return response.status(400).json({
        status: 'error',
        message: 'Invalid resource ID. Must be a positive integer.'
      });
    }

    const deleted = await ResourceModel.delete(id);
    if (!deleted) {
      return response.status(404).json({
        status: 'error',
        message: `Resource with ID ${id} was not found.`
      });
    }

    return response.json({
      status: 'success',
      message: 'Resource deleted successfully.',
      data: deleted
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/recommendations
 * Generates personalized recommendations based on recent search history
 * using the persistent PostgreSQL resource catalog.
 */
async function getPersonalizedRecommendations(request, response, next) {
  try {
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

    // Retrieve live resources from PostgreSQL
    let resources = [];
    let source = 'postgresql';
    try {
      resources = await ResourceModel.findAll();
    } catch (dbErr) {
      console.warn('DB query failed in recommendations, falling back to sample:', dbErr.message);
      resources = getSampleResources();
      source = 'temporary-sample-data';
    }

    const recommendations = getRecommendations(
      Array.isArray(history) ? history : [],
      resources
    );

    return response.json({
      status: 'ok',
      personalized: Array.isArray(history) && history.length > 0,
      source,
      recommendations
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getStatus,
  getAllResources,
  getProducts: getAllResources, // Alias for backward compatibility
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  getPersonalizedRecommendations
};
