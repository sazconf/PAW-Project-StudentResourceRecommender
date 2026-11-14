/**
 * Smart Student Resource Recommender (SSR) — Domain Guardrails & Prompt Injection Protection
 *
 * Enforces backend-side domain restrictions and prompt-injection checks BEFORE
 * sending requests to Google Gemini. Uses the PostgreSQL resource catalog
 * (via ssrContext.service.js) as the primary source of domain relevance.
 */

const {
  stripInvisibleUnicode,
  extractDifficultyFilter,
  extractSearchTerms,
  isCatalogDiscoveryQuery,
  retrieveRelevantResources
} = require('./ssrContext.service');

const MAX_QUESTION_LENGTH = 2000;

const OUT_OF_SCOPE_REPLY = 'I can only help with learning resources available in SSR.';
const PROMPT_INJECTION_REPLY =
  'I cannot follow instructions that attempt to override my rules. I can only help with learning resources available in SSR.';
const INVALID_INPUT_REPLY = 'Please enter a question about learning resources available in SSR.';

// Targeted phrase patterns to detect instruction-override and prompt-extraction
// attempts without over-blocking ordinary words like "ignore" or "system".
const PROMPT_INJECTION_PATTERNS = [
  /\b(ignore|disregard|forget|override|bypass|skip|drop|abandon)\s+(all\s+|any\s+|every\s+|the\s+|your\s+|previous\s+|prior\s+|above\s+|earlier\s+|system\s+|ssr\s+)*(instructions?|rules?|prompts?|directives?|guidelines?|restrictions?|guardrails?|constraints?|policies?)\b/i,
  /\b(reveal|show|display|print|output|repeat|leak|expose|dump)\s+(all\s+|the\s+|your\s+|hidden\s+|secret\s+|internal\s+|system\s+|initial\s+|original\s+)*(instructions?|system\s*prompt|configuration|config|api\s*keys?|secrets?|\.env|environment\s+variables?)\b/i,
  /\b(what\s+(is|are)|tell\s+me|give\s+me)\s+your\s+(hidden\s+|secret\s+|internal\s+|system\s+|initial\s+|original\s+)*(instructions?|rules?|system\s*prompt|prompt|configuration|api\s*keys?|secrets?)\b/i,
  /\b(act\s+as|pretend\s+(to\s+be|you\s+are)|roleplay\s+as|you\s+are\s+now|switch\s+to|enter)\s+(an?\s+)?(unrestricted|unfiltered|uncensored|evil|dan|jailbroken|developer\s+mode|admin\s+mode|god\s+mode|different\s+(ai|assistant|bot|model)|general\s+(ai|assistant))\b/i,
  /\b(jailbreak|do\s+anything\s+now|dan\s+mode)\b/i,
  /\b(treat|interpret|use|accept|follow|consider)\s+(this|the\s+following)(\s+text|\s+message|\s+input)?\s+as\s+(a\s+|your\s+)?(new\s+)?(system\s*(instruction|prompt|message|role)|instructions?)\b/i,
  /(?:^|[.!?\n]\s*)(system|developer)\s*:\s*/i,
  /<\|\s*(system|developer|assistant)\s*\|>/i,
  /\[\s*system\s*(instruction|prompt)?\s*\]/i
];

// Clearly off-topic entertainment, sports, weather, politics, and personal queries.
const OFF_TOPIC_PATTERNS = [
  /\b(tell\s+(me\s+)?(a\s+)?joke|write\s+(me\s+)?(a\s+)?(poem|story|song|rap|haiku|essay|novel)|play\s+(a\s+)?game|video\s+games?|movies?|netflix|anime|celebrity|horoscope|astrology|lottery|gambling)\b/i,
  /\b(weather\s+(in|for|today|tomorrow)|weather\s+forecast|world\s+cup|premier\s+league|nba|nfl|recipe\s+for|cook\s+a|restaurant|flight\s+to|hotel\s+in|stock\s+price|bitcoin|crypto)\b/i,
  /\b(election|vote\s+for|political\s+party|democrat|republican|president\s+of|prime\s+minister|parliament|senate)\b/i,
  /\b(how\s+old\s+are\s+you|what\s+is\s+your\s+favorite|who\s+is\s+your\s+favorite|do\s+you\s+have\s+feelings|are\s+you\s+single|where\s+do\s+you\s+live)\b/i
];

// Requests asking the AI to perform general coding/homework tasks rather than
// discovering or understanding SSR learning resources.
const GENERAL_TASK_PATTERNS = [
  /^(?:\s*(?:please|can\s+you|could\s+you|would\s+you|will\s+you)\s+)*(?:help\s+me\s+)?(?:write|code|implement|create|build|generate|debug|fix|solve|calculate|compute|translate|summarize|proofread|refactor|rewrite)\b/i,
  /\b(?:write|create|build|generate)\s+(?:me\s+)?(?:a|an|some|the)?\s*(?:python|javascript|js|html|css|sql|java|c\+\+|code|script|program|function|query|app|website|bot|game)\b/i,
  /\b(?:debug|fix|refactor)\s+(?:my|this|the)\s+(?:[a-z]+\s+)?(?:code|script|function|query|bug|program|homework|assignment|app|website)\b/i,
  /\b(?:solve|calculate|compute)\s+(?:this|the|my)\s+(?:[a-z]+\s+)?(?:equation|problem|homework|assignment|integral|derivative)\b/i,
  /\bhow\s+(?:do|can)\s+i\s+(?:build|create|write|implement|code|solve|debug)\s+(?:a|an|my|this)\b/i
];

// Explicit requests to search, recommend, or discover SSR learning resources.
// Used so "What resources help me learn to write Python?" is allowed, while
// "Write a Python script for my course" is still rejected as a task request.
const EXPLICIT_RESOURCE_SEARCH_PATTERNS = [
  /^\s*(?:please\s+|can\s+you\s+|could\s+you\s+)?(?:what|which|are\s+there|do\s+you\s+have|recommend|suggest|show|list|find|looking\s+for|tell\s+me\s+about)\b.*\b(?:resources?|courses?|tutorials?|guides?|labs?|materials?|catalog|catalogue|documentation)\b/i,
  /\b(?:recommend|suggest|find)\s+(?:me\s+)?(?:a|an|some|any)?\s*(?:beginner|intermediate|advanced)?[-\s]*(?:level\s+)?(?:resources?|courses?|tutorials?|guides?|labs?|materials?)\b/i
];

// Signals that the user is genuinely asking about learning resources in SSR.
const RESOURCE_DISCOVERY_INTENT_PATTERNS = [
  /\b(ssr|catalog|catalogue|resources?|materials?|courses?|tutorials?|guides?|labs?|documentation|ebooks?|books?)\b/i,
  /\b(recommend|suggest)\b/i,
  /\bwhat\s+(can|should)\s+i\s+(learn|study)\b/i,
  /\bhelp\s+me\s+(learn|study|find|choose|select)\b/i,
  /\blooking\s+for\s+(a\s+|an\s+|some\s+)?(beginner|intermediate|advanced|study|learning)\b/i,
  /\b(difference\s+between|compare)\b/i,
  /\b(beginner|intermediate|advanced)[-\s]*level\b/i,
  /\bdifficulty\s+level\b/i,
  /\b(what|which)\s+(subjects|topics)\b/i
];

/**
 * Normalize hidden/invisible Unicode formatting characters and whitespace.
 *
 * @param {string} text
 * @returns {string}
 */
function normalizeForInspection(text) {
  return stripInvisibleUnicode(text)
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detect obvious prompt injection or system-instruction override attempts.
 *
 * @param {string} message
 * @returns {boolean}
 */
function detectPromptInjection(message) {
  if (typeof message !== 'string') return false;
  const normalized = normalizeForInspection(message);
  return PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(normalized));
}

/**
 * Determine whether the message contains explicit SSR/learning-resource discovery intent.
 *
 * @param {string} message
 * @returns {boolean}
 */
function hasResourceDiscoveryIntent(message) {
  if (typeof message !== 'string') return false;
  const normalized = normalizeForInspection(message);
  return (
    isCatalogDiscoveryQuery(normalized) ||
    RESOURCE_DISCOVERY_INTENT_PATTERNS.some((pattern) => pattern.test(normalized))
  );
}

/**
 * Determine whether the message is clearly off-topic or a general non-SSR task.
 *
 * @param {string} message
 * @param {boolean} hasResourceIntent
 * @returns {boolean}
 */
function isOffTopicOrGeneralTask(message) {
  const normalized = normalizeForInspection(message);

  if (OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  const explicitResourceSearch = EXPLICIT_RESOURCE_SEARCH_PATTERNS.some((pattern) =>
    pattern.test(normalized)
  );

  if (!explicitResourceSearch && GENERAL_TASK_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  return false;
}

/**
 * Validate whether a student's question is safe and within the SSR domain
 * before sending it to Google Gemini.
 *
 * Uses the PostgreSQL resource catalog (via ResourceModel) as the primary
 * source of relevance, while still allowing reasonable catalog discovery
 * questions (e.g., "What can I learn about networking?" or "Recommend beginner-level resources").
 *
 * @param {string} message — The student's raw message.
 * @returns {Promise<{ allowed: boolean, reason: string|null, reply?: string }>}
 */
async function checkSSRQuestion(message) {
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return {
      allowed: false,
      reason: 'INVALID_INPUT',
      reply: INVALID_INPUT_REPLY
    };
  }

  const trimmed = message.trim();
  if (trimmed.length > MAX_QUESTION_LENGTH) {
    return {
      allowed: false,
      reason: 'INVALID_INPUT',
      reply: `Your message is too long (maximum ${MAX_QUESTION_LENGTH} characters). Please ask a concise question about SSR learning resources.`
    };
  }

  // 1. Prompt injection protection runs first.
  if (detectPromptInjection(trimmed)) {
    return {
      allowed: false,
      reason: 'PROMPT_INJECTION',
      reply: PROMPT_INJECTION_REPLY
    };
  }

  // 2. Check explicit off-topic and general programming/homework tasks.
  const resourceIntent = hasResourceDiscoveryIntent(trimmed);
  if (isOffTopicOrGeneralTask(trimmed)) {
    return {
      allowed: false,
      reason: 'OUT_OF_SCOPE',
      reply: OUT_OF_SCOPE_REPLY
    };
  }

  // 3. Use the live resource catalog as the primary source of relevance.
  const searchTerms = extractSearchTerms(trimmed);
  const difficulty = extractDifficultyFilter(trimmed);

  if (searchTerms.length > 0 || difficulty) {
    try {
      const { resources } = await retrieveRelevantResources(trimmed, { limit: 1 });
      if (resources.length > 0) {
        return {
          allowed: true,
          reason: null
        };
      }
    } catch (error) {
      // Do not fail open to unrelated prompts on DB errors, but still allow
      // explicit resource-discovery questions so getSSRContext can report safely.
      console.error('Guardrail catalog lookup error:', error.message);
    }
  }

  // 4. Allow reasonable learning-resource discovery questions even when no exact
  // catalog row matches (e.g. "What can I learn about networking?").
  if (resourceIntent || difficulty) {
    return {
      allowed: true,
      reason: null
    };
  }

  // 5. Reject everything else before calling Gemini.
  return {
    allowed: false,
    reason: 'OUT_OF_SCOPE',
    reply: OUT_OF_SCOPE_REPLY
  };
}

module.exports = {
  MAX_QUESTION_LENGTH,
  OUT_OF_SCOPE_REPLY,
  PROMPT_INJECTION_REPLY,
  INVALID_INPUT_REPLY,
  detectPromptInjection,
  hasResourceDiscoveryIntent,
  checkSSRQuestion
};
