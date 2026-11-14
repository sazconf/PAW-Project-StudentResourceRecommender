/**
 * Gemini API Configuration
 *
 * Initializes the Google Gemini SDK client using environment variables.
 * Exports a reusable configured client for use across the application.
 *
 * Required environment variables:
 *   GEMINI_API_KEY  — Your Google Gemini API key
 *   GEMINI_MODEL    — The Gemini model to use (e.g. gemini-3.5-flash-lite)
 */

const { GoogleGenAI } = require('@google/genai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

/**
 * Validate that the API key is present and non-empty.
 * Throws a descriptive error if the key is missing so the application
 * fails fast during startup rather than at request time.
 */
function validateConfig() {
  if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === '') {
    throw new Error(
      'GEMINI_API_KEY is not set. ' +
      'Please add a valid Gemini API key to your .env file. ' +
      'You can obtain one from https://aistudio.google.com/apikey'
    );
  }
}

/**
 * Create and return the configured GoogleGenAI client.
 * Validates the API key before initialization.
 *
 * @returns {{ ai: GoogleGenAI, model: string }}
 */
function createGeminiClient() {
  validateConfig();

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  return {
    ai,
    model: GEMINI_MODEL
  };
}

module.exports = {
  createGeminiClient,
  validateConfig,
  GEMINI_MODEL
};
