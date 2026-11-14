/**
 * Gemini Service — Automated Unit Tests (Mocked, No Real API Calls)
 *
 * Run with:   node test/gemini.test.js
 *
 * These tests validate the service's behavior using mocked dependencies.
 * They do NOT require a real GEMINI_API_KEY or network access.
 */

// Load environment before anything else
require('dotenv').config();

let passCount = 0;
let failCount = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failCount++;
  }
}

async function assertThrows(fn, expectedSubstring, testName) {
  try {
    await fn();
    console.error(`  ✗ FAIL: ${testName} (no error thrown)`);
    failCount++;
  } catch (err) {
    if (err.message.includes(expectedSubstring)) {
      console.log(`  ✓ PASS: ${testName}`);
      passCount++;
    } else {
      console.error(
        `  ✗ FAIL: ${testName} — expected "${expectedSubstring}" but got "${err.message}"`
      );
      failCount++;
    }
  }
}

async function runUnitTests() {
  console.log('=== Gemini Service — Unit Tests (Mocked) ===\n');

  // ── Test 1: Missing API key produces a configuration error ─────────
  console.log('[1] Missing API key handling');
  const originalKey = process.env.GEMINI_API_KEY;

  // Temporarily remove the key
  delete process.env.GEMINI_API_KEY;

  // Clear the module cache so the config re-reads env vars
  delete require.cache[require.resolve('../config/gemini')];
  delete require.cache[require.resolve('../services/gemini.service')];

  const { generateGeminiResponse: genNoKey } = require('../services/gemini.service');

  await assertThrows(
    () => genNoKey({ message: 'test' }),
    'GEMINI_API_KEY is not set',
    'Throws configuration error when API key is missing'
  );

  // Restore
  process.env.GEMINI_API_KEY = originalKey;
  delete require.cache[require.resolve('../config/gemini')];
  delete require.cache[require.resolve('../services/gemini.service')];

  // ── Test 2: Empty message is rejected ──────────────────────────────
  console.log('\n[2] Empty message validation');
  const { generateGeminiResponse: genEmpty } = require('../services/gemini.service');

  await assertThrows(
    () => genEmpty({ message: '' }),
    'Message is required',
    'Throws error for empty message'
  );

  await assertThrows(
    () => genEmpty({ message: '   ' }),
    'Message is required',
    'Throws error for whitespace-only message'
  );

  await assertThrows(
    () => genEmpty({}),
    'Message is required',
    'Throws error when message is undefined'
  );

  // ── Test 3: Config module validates and exports correctly ──────────
  console.log('\n[3] Config module exports');
  delete require.cache[require.resolve('../config/gemini')];
  const geminiConfig = require('../config/gemini');

  assert(typeof geminiConfig.createGeminiClient === 'function', 'createGeminiClient is a function');
  assert(typeof geminiConfig.validateConfig === 'function', 'validateConfig is a function');
  assert(typeof geminiConfig.GEMINI_MODEL === 'string', 'GEMINI_MODEL is a string');
  assert(geminiConfig.GEMINI_MODEL.length > 0, 'GEMINI_MODEL is not empty');

  // ── Test 4: API key is never printed or exposed ────────────────────
  console.log('\n[4] API key security');
  const configSource = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'config', 'gemini.js'),
    'utf8'
  );
  assert(!configSource.includes('console.log') || !configSource.includes('API_KEY'), 'Config does not log API key');

  const serviceSource = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'services', 'gemini.service.js'),
    'utf8'
  );
  assert(!serviceSource.includes('console.log'), 'Service does not use console.log');

  // ── Test 5: Service module exports correctly ───────────────────────
  console.log('\n[5] Service module exports');
  delete require.cache[require.resolve('../services/gemini.service')];
  const geminiService = require('../services/gemini.service');

  assert(typeof geminiService.generateGeminiResponse === 'function', 'generateGeminiResponse is a function');

  // ── Summary ────────────────────────────────────────────────────────
  console.log('\n========================================');
  console.log(` Unit Tests: ${passCount} passed, ${failCount} failed`);
  console.log('========================================');

  if (failCount > 0) {
    process.exitCode = 1;
  }
}

runUnitTests();

