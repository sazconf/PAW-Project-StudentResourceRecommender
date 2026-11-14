/**
 * Chat Validation Middleware — Member 3
 *
 * Validates incoming chat request bodies before they reach the controller.
 * Rejects missing, empty, whitespace-only, non-string, or overlong messages.
 *
 * Usage:
 *   const { validateChatMessage } = require('../middlewares/chatValidation');
 *   router.post('/chat', validateChatMessage, chatController.handleChat);
 */

const MAX_MESSAGE_LENGTH = 2000;

/**
 * Express middleware that validates the `message` field in req.body.
 *
 * Returns HTTP 400 with a JSON error if validation fails.
 */
function validateChatMessage(req, res, next) {
  const { message } = req.body;

  // Missing message field
  if (message === undefined || message === null) {
    return res.status(400).json({
      status: 'error',
      message: 'Message is required.'
    });
  }

  // Non-string message
  if (typeof message !== 'string') {
    return res.status(400).json({
      status: 'error',
      message: 'Message must be a string.'
    });
  }

  // Empty or whitespace-only message
  if (message.trim() === '') {
    return res.status(400).json({
      status: 'error',
      message: 'Message cannot be empty.'
    });
  }

  // Overlong message
  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({
      status: 'error',
      message: `Message must not exceed ${MAX_MESSAGE_LENGTH} characters.`
    });
  }

  next();
}

module.exports = {
  validateChatMessage,
  MAX_MESSAGE_LENGTH
};
