/**
 * Chat Controller — Member 3
 *
 * Handles POST /api/chat requests by orchestrating Member 1 and Member 2 services:
 *   1. Guardrails check  (Member 2 — ssrGuardrails.service.js)
 *   2. Context retrieval  (Member 2 — ssrContext.service.js)
 *   3. System instruction (Member 2 — ssrSystemInstruction.js)
 *   4. Gemini response    (Member 1 — gemini.service.js)
 *
 * Usage:
 *   const { handleChat } = require('../controllers/chatController');
 *   router.post('/chat', validateChatMessage, handleChat);
 */

const { checkSSRQuestion } = require('../services/ssrGuardrails.service');
const { getSSRContext } = require('../services/ssrContext.service');
const { getSSRSystemInstruction } = require('../config/ssrSystemInstruction');
const { generateGeminiResponse } = require('../services/gemini.service');

/**
 * POST /api/chat
 *
 * Request body: { "message": "..." }
 *
 * Successful response:
 * {
 *   "success": true,
 *   "reply": "...",
 *   "resources": [...]
 * }
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function handleChat(req, res, next) {
  try {
    const { message } = req.body;

    // ── Step 1: Guardrails — check if the question is allowed ─────────
    const guardrailResult = await checkSSRQuestion(message);

    if (!guardrailResult.allowed) {
      return res.status(400).json({
        success: false,
        reply: guardrailResult.reply,
        resources: []
      });
    }

    // ── Step 2: Context retrieval from database ───────────────────────
    const contextResult = await getSSRContext(message);

    if (!contextResult.success) {
      return res.status(500).json({
        success: false,
        reply: 'We are experiencing a temporary issue retrieving resources. Please try again later.',
        resources: []
      });
    }

    // ── Step 3: Get system instruction ────────────────────────────────
    const systemInstruction = getSSRSystemInstruction();

    // ── Step 4: Generate Gemini response ──────────────────────────────
    let reply;
    try {
      reply = await generateGeminiResponse({
        message,
        systemInstruction,
        context: contextResult.context
      });
    } catch (geminiError) {
      console.error('Chat controller — Gemini API error:', geminiError.message);
      return res.status(502).json({
        success: false,
        reply: 'The AI service is temporarily unavailable. Please try again later.',
        resources: []
      });
    }

    // ── Step 5: Return successful response ────────────────────────────
    return res.json({
      success: true,
      reply,
      resources: contextResult.resources
    });
  } catch (error) {
    // Unexpected errors — do not expose internals
    console.error('Chat controller — unexpected error:', error.message);
    return res.status(500).json({
      success: false,
      reply: 'An unexpected error occurred. Please try again later.',
      resources: []
    });
  }
}

module.exports = {
  handleChat
};
