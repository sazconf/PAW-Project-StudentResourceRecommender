-- Smart Student Resource Recommender (SSR)
-- Database Schema for PostgreSQL

-- Create database (if running manually in psql):
-- CREATE DATABASE student_resource_recommender;

DROP TABLE IF EXISTS resources;

CREATE TABLE resources (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  keyword VARCHAR(255) NOT NULL,
  difficulty VARCHAR(30) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_resources_subject ON resources (subject);
CREATE INDEX IF NOT EXISTS idx_resources_difficulty ON resources (difficulty);
