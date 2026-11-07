const { query } = require('../config/db');

/**
 * Resource Model
 * Handles all database operations for the `resources` table.
 * All queries are parameterized to prevent SQL injection.
 */
class ResourceModel {
  /**
   * Retrieve all resources with optional filtering and sorting.
   * @param {Object} [filters]
   * @param {string} [filters.subject]
   * @param {string} [filters.keyword]
   * @param {string} [filters.difficulty]
   * @param {string} [filters.sort]
   * @returns {Promise<Array>}
   */
  static async findAll(filters = {}) {
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (filters.subject && filters.subject.trim()) {
      conditions.push(`LOWER(subject) = LOWER($${paramIndex++})`);
      values.push(filters.subject.trim());
    }

    if (filters.difficulty && filters.difficulty.trim()) {
      conditions.push(`LOWER(difficulty) = LOWER($${paramIndex++})`);
      values.push(filters.difficulty.trim());
    }

    if (filters.keyword && filters.keyword.trim()) {
      const searchTerm = `%${filters.keyword.trim()}%`;
      conditions.push(
        `(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR keyword ILIKE $${paramIndex} OR subject ILIKE $${paramIndex})`
      );
      values.push(searchTerm);
      paramIndex++;
    }

    let sql = 'SELECT * FROM resources';
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    // Sorting
    switch (filters.sort) {
      case 'title':
        sql += ' ORDER BY title ASC';
        break;
      case 'difficulty':
        // Custom pedagogical order: Beginner -> Intermediate -> Advanced
        sql += ` ORDER BY CASE 
          WHEN difficulty ILIKE 'beginner' THEN 1 
          WHEN difficulty ILIKE 'intermediate' THEN 2 
          WHEN difficulty ILIKE 'advanced' THEN 3 
          ELSE 4 END ASC, title ASC`;
        break;
      case 'newest':
        sql += ' ORDER BY created_at DESC, id DESC';
        break;
      default:
        sql += ' ORDER BY id ASC';
        break;
    }

    const result = await query(sql, values);
    return result.rows;
  }

  /**
   * Find a single resource by its primary key ID.
   * @param {number|string} id
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const sql = 'SELECT * FROM resources WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  /**
   * Insert a new resource record.
   * @param {Object} resourceData
   * @returns {Promise<Object>} The created resource row.
   */
  static async create({
    title,
    subject,
    keyword,
    difficulty,
    resource_type,
    description = '',
    url
  }) {
    const sql = `
      INSERT INTO resources (title, subject, keyword, difficulty, resource_type, description, url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      title.trim(),
      subject.trim(),
      keyword.trim(),
      difficulty.trim(),
      resource_type.trim(),
      (description || '').trim(),
      url.trim()
    ];

    const result = await query(sql, values);
    return result.rows[0];
  }

  /**
   * Update an existing resource.
   * @param {number|string} id
   * @param {Object} resourceData
   * @returns {Promise<Object|null>} The updated resource row or null if not found.
   */
  static async update(
    id,
    { title, subject, keyword, difficulty, resource_type, description = '', url }
  ) {
    const sql = `
      UPDATE resources
      SET title = $1,
          subject = $2,
          keyword = $3,
          difficulty = $4,
          resource_type = $5,
          description = $6,
          url = $7
      WHERE id = $8
      RETURNING *
    `;
    const values = [
      title.trim(),
      subject.trim(),
      keyword.trim(),
      difficulty.trim(),
      resource_type.trim(),
      (description || '').trim(),
      url.trim(),
      id
    ];

    const result = await query(sql, values);
    return result.rows[0] || null;
  }

  /**
   * Delete a resource by ID.
   * @param {number|string} id
   * @returns {Promise<Object|null>} The deleted resource row or null if not found.
   */
  static async delete(id) {
    const sql = 'DELETE FROM resources WHERE id = $1 RETURNING *';
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  /**
   * Count total resources.
   * @returns {Promise<number>}
   */
  static async count() {
    const sql = 'SELECT COUNT(*) AS total FROM resources';
    const result = await query(sql);
    return parseInt(result.rows[0].total, 10);
  }
}

module.exports = ResourceModel;
