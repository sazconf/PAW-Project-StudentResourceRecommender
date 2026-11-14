/**
 * Gemini Service — Manual Integration Test (Requires Real API Key)
 *
 * This test sends a real request to the Google Gemini API to verify
 * the full integration works end-to-end.
 *
 * Run with:   node test/gemini.integration.js
 *
 * Prerequisites:
 *   - A valid GEMINI_API_KEY must be set in your .env file.
 *   - Network access to the Google Gemini API is required.
 *
 * NOTE: This test does NOT print the API key.
 */

require('dotenv').config();

const { generateGeminiResponse } = require('../services/gemini.service');

async function runIntegrationTest() {
  console.log('=== Gemini Service — Manual Integration Test ===\n');
  console.log(`Model: ${process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'}`);
  console.log(`API Key configured: ${process.env.GEMINI_API_KEY ? 'Yes (hidden)' : 'No'}\n`);

  // ── Test 1: Simple text question ───────────────────────────────────
  console.log('[1] Sending a simple text question to Gemini...');
  try {
    const response = await generateGeminiResponse({
      message: 'What is 2 + 2? Reply with only the number.'
    });

    console.log('  Response received:', response);
    console.log('  Response is non-empty:', response.length > 0 ? '✓ PASS' : '✗ FAIL');
  } catch (err) {
    console.error('  ✗ FAIL:', err.message);
    if (err.type) console.error('  Error type:', err.type);
  }

  // ── Test 2: With system instruction and context ────────────────────
  console.log('\n[2] Sending a request with system instruction and context...');
  try {
    const response = await generateGeminiResponse({
      message: 'What resources do you recommend for learning SQL?',
      systemInstruction: 'You are a helpful university study assistant. Be concise.',
      context: 'Available resources in the database:\n- "SQL for Beginners" (Beginner, Video Tutorial)\n- "Advanced Database Design" (Advanced, Article)'
    });

    console.log('  Response received:', response.substring(0, 200) + (response.length > 200 ? '...' : ''));
    console.log('  Response is non-empty:', response.length > 0 ? '✓ PASS' : '✗ FAIL');
  } catch (err) {
    console.error('  ✗ FAIL:', err.message);
    if (err.type) console.error('  Error type:', err.type);
  }

  // ── Test 3: Missing API key handled gracefully ─────────────────────
  console.log('\n[3] Testing missing API key error handling...');
  const savedKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  // Clear cache to force re-read
  delete require.cache[require.resolve('../config/gemini')];
  delete require.cache[require.resolve('../services/gemini.service')];
  const { generateGeminiResponse: genNoKey } = require('../services/gemini.service');

  try {
    await genNoKey({ message: 'test' });
    console.log('  ✗ FAIL: Should have thrown an error');
  } catch (err) {
    const isCorrectError = err.message.includes('GEMINI_API_KEY is not set');
    console.log('  Error message:', err.message);
    console.log('  Correct error type:', isCorrectError ? '✓ PASS' : '✗ FAIL');
    // Verify the key is NOT in the error message
    const keyExposed = savedKey && err.message.includes(savedKey);
    console.log('  API key not exposed:', !keyExposed ? '✓ PASS' : '✗ FAIL');
  }

  // Restore
  process.env.GEMINI_API_KEY = savedKey;
  delete require.cache[require.resolve('../config/gemini')];
  delete require.cache[require.resolve('../services/gemini.service')];

  console.log('\n========================================');
  console.log(' Integration test complete.');
  console.log('========================================');
}

runIntegrationTest();

