/**
 * Gemini Service — Reusable Google Gemini API Integration
 *
 * Provides a single function to generate text responses from Google Gemini.
 * This service is independent of Express controllers and frontend code.
 *
 * Usage:
 *   const { generateGeminiResponse } = require('../services/gemini.service');
 *
 *   const reply = await generateGeminiResponse({
 *     message: 'What is recursion?',
 *     systemInstruction: 'You are a helpful study assistant...',
 *     context: 'Available resources: ...'
 *   });
 */

const { createGeminiClient } = require('../config/gemini');

/**
 * Generate a text response from the Gemini API.
 *
 * @param {Object} params
 * @param {string} params.message           — The user's message / question.
 * @param {string} [params.systemInstruction] — System instruction for the model
 *                                              (provided by the calling component, e.g. Member 2).
 * @param {string} [params.context]          — Application context such as relevant resources
 *                                              (provided by the calling component, e.g. Member 2).
 * @returns {Promise<string>} The generated text response from Gemini.
 *
 * @throws {Error} With descriptive messages for configuration, authentication,
 *                 rate-limit, network, or empty-response issues.
 */
async function generateGeminiResponse({ message, systemInstruction, context }) {
  // ── 1. Validate input ──────────────────────────────────────────────
  if (!message || typeof message !== 'string' || message.trim() === '') {
    throw new Error('Message is required and must be a non-empty string.');
  }

  // ── 2. Initialize the Gemini client ────────────────────────────────
  let ai, model;
  try {
    ({ ai, model } = createGeminiClient());
  } catch (err) {
    const configError = new Error(
      'Gemini configuration error: ' + err.message
    );
    configError.type = 'CONFIGURATION_ERROR';
    throw configError;
  }

  // ── 3. Build the prompt contents ───────────────────────────────────
  // Combine the optional context with the user message.
  // The context gives the model relevant application data (e.g. resources from the DB).
  const parts = [];
  if (context && context.trim() !== '') {
    parts.push(context.trim());
    parts.push(''); // blank line separator
  }
  parts.push(message.trim());

  const userContent = parts.join('\n');

  // ── 4. Build the request configuration ─────────────────────────────
  const requestConfig = {
    model,
    contents: userContent,
    config: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 2048
    }
  };

  // Add system instruction if provided by the calling component.
  if (systemInstruction && systemInstruction.trim() !== '') {
    requestConfig.config.systemInstruction = systemInstruction.trim();
  }

  // ── 5. Call the Gemini API ─────────────────────────────────────────
  let response;
  try {
    response = await ai.models.generateContent(requestConfig);
  } catch (err) {
    throw classifyApiError(err);
  }

  // ── 6. Extract and validate the response text ─────────────────────
  const text = response?.text;

  if (!text || typeof text !== 'string' || text.trim() === '') {
    const emptyError = new Error(
      'Gemini returned an empty response. The model did not generate any text.'
    );
    emptyError.type = 'EMPTY_RESPONSE';
    throw emptyError;
  }

  return text.trim();
}

/**
 * Classify a Gemini API error into a user-friendly error with a type tag.
 *
 * @param {Error} err — The raw error from the SDK.
 * @returns {Error}   — A classified error with a `type` property.
 */
function classifyApiError(err) {
  const errorMessage = (err.message || '').toLowerCase();
  const statusCode = err.status || err.statusCode || err.code;

  // Authentication / invalid API key
  if (
    statusCode === 401 ||
    statusCode === 403 ||
    errorMessage.includes('api key') ||
    errorMessage.includes('permission') ||
    errorMessage.includes('authenticate') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('forbidden')
  ) {
    const authError = new Error(
      'Gemini authentication failed. Please verify your GEMINI_API_KEY is valid.'
    );
    authError.type = 'AUTHENTICATION_ERROR';
    authError.status = 401;
    return authError;
  }

  // Rate limiting
  if (
    statusCode === 429 ||
    errorMessage.includes('rate') ||
    errorMessage.includes('quota') ||
    errorMessage.includes('resource exhausted') ||
    errorMessage.includes('too many requests')
  ) {
    const rateError = new Error(
      'Gemini API rate limit reached. The service is temporarily busy. Please try again later.'
    );
    rateError.type = 'RATE_LIMIT_ERROR';
    rateError.status = 429;
    return rateError;
  }

  // Network / connectivity issues
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('econnrefused') ||
    errorMessage.includes('enotfound') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('socket') ||
    errorMessage.includes('fetch failed') ||
    err.code === 'ECONNREFUSED' ||
    err.code === 'ENOTFOUND' ||
    err.code === 'ETIMEDOUT'
  ) {
    const networkError = new Error(
      'Unable to reach the Gemini API. Please check your network connection and try again.'
    );
    networkError.type = 'NETWORK_ERROR';
    networkError.status = 503;
    return networkError;
  }

  // Model not found or invalid model name
  if (
    statusCode === 404 ||
    errorMessage.includes('not found') ||
    errorMessage.includes('model')
  ) {
    const modelError = new Error(
      'The configured Gemini model was not found. Please verify the GEMINI_MODEL value in your .env file.'
    );
    modelError.type = 'MODEL_ERROR';
    modelError.status = 404;
    return modelError;
  }

  // Generic / unknown API error — never expose raw internal details
  const genericError = new Error(
    'An unexpected error occurred while communicating with the Gemini API. Please try again later.'
  );
  genericError.type = 'API_ERROR';
  genericError.status = 500;
  return genericError;
}

module.exports = {
  generateGeminiResponse
};

