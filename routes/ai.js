const express = require('express');
const router = express.Router();
const { sendAiOtp, verifyAiOtp, verifyAiSession } = require('../controllers/ai/aiOtp');
const {
  saveKnowledge,
  searchKnowledge,
  getAllKnowledge,
  updateKnowledge,
  deleteKnowledge,
  createManualKnowledge,
} = require('../controllers/ai/aiKnowledge');
const {
  getRulesForPrompt,
  getAllRules,
  createRule,
  updateRule,
  updateRuleByNumber,
  deleteRule,
  seedRules,
} = require('../controllers/ai/aiRules');

// @route   POST /api/ai/send-otp
// @desc    Send OTP to email for AI assistant booking verification
// @access  Public
router.post('/send-otp', sendAiOtp);

// @route   POST /api/ai/verify-otp
// @desc    Verify OTP for AI assistant booking lookup
// @access  Public
router.post('/verify-otp', verifyAiOtp);

// @route   POST /api/ai/verify-session
// @desc    Validate AI session token before allowing data access
// @access  Internal (called by Next.js proxy)
router.post('/verify-session', verifyAiSession);

// --- AI Knowledge Base ---

// @route   POST /api/ai/knowledge
// @desc    Save a Q&A pair from AI conversation (auto-collected)
// @access  Internal (called by Next.js AI chat route)
router.post('/knowledge', saveKnowledge);

// @route   GET /api/ai/knowledge/search?q=<query>&limit=5
// @desc    Search knowledge base for relevant Q&A pairs
// @access  Internal (called by Next.js AI chat route)
router.get('/knowledge/search', searchKnowledge);

// @route   GET /api/ai/knowledge?page=1&limit=50&category=pricing
// @desc    List all knowledge entries (for admin curation)
// @access  Admin
router.get('/knowledge', getAllKnowledge);

// @route   POST /api/ai/knowledge/manual
// @desc    Create a manually curated knowledge entry
// @access  Admin
router.post('/knowledge/manual', createManualKnowledge);

// @route   PUT /api/ai/knowledge/:id
// @desc    Update/correct a knowledge entry
// @access  Admin
router.put('/knowledge/:id', updateKnowledge);

// @route   DELETE /api/ai/knowledge/:id
// @desc    Delete a knowledge entry
// @access  Admin
router.delete('/knowledge/:id', deleteKnowledge);

// --- AI Rules ---

// @route   GET /api/ai/rules/prompt
// @desc    Get all active rules formatted for system prompt (cached in Redis)
// @access  Internal (called by Next.js AI chat route)
router.get('/rules/prompt', getRulesForPrompt);

// @route   GET /api/ai/rules
// @desc    List all rules (for admin)
// @access  Admin
router.get('/rules', getAllRules);

// @route   POST /api/ai/rules
// @desc    Create a new rule (from training mode or admin)
// @access  Admin / Training
router.post('/rules', createRule);

// @route   POST /api/ai/rules/seed
// @desc    Seed/migrate initial rules from hardcoded to DB
// @access  Admin
router.post('/rules/seed', seedRules);

// @route   PUT /api/ai/rules/by-number/:ruleNumber
// @desc    Update a rule by its rule number (used by training mode)
// @access  Admin / Training
router.put('/rules/by-number/:ruleNumber', updateRuleByNumber);

// @route   PUT /api/ai/rules/:id
// @desc    Update a rule by MongoDB ID
// @access  Admin
router.put('/rules/:id', updateRule);

// @route   DELETE /api/ai/rules/:id
// @desc    Delete a rule
// @access  Admin
router.delete('/rules/:id', deleteRule);

module.exports = router;
