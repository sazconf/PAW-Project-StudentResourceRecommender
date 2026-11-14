/**
 * Chat Routes — Member 3
 *
 * Defines the POST /chat endpoint and wires up
 * validation middleware and the chat controller.
 *
 * Mounted at /api in app.js, so the full path is POST /api/chat.
 */

const express = require('express');
const { validateChatMessage } = require('../middlewares/chatValidation');
const { handleChat } = require('../controllers/chatController');

const router = express.Router();

// POST /api/chat — AI-powered chat endpoint
router.post('/chat', validateChatMessage, handleChat);

module.exports = router;
