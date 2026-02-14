const AiRule = require('../../models/aiRule');
const { getJSON, setJSON, clearCache } = require('../../utils/redis');

const RULES_CACHE_KEY = 'ai_rules:active';
const RULES_CACHE_TTL = 1800; // 30 minutes

/**
 * Get all active rules formatted for the system prompt
 * GET /api/ai/rules/prompt
 * Returns a single string ready to inject into the AI system prompt.
 * Uses Redis cache for speed.
 */
const getRulesForPrompt = async (req, res) => {
  try {
    // Check Redis cache first
    const cached = await getJSON(RULES_CACHE_KEY);
    if (cached) {
      return res.json({ success: true, prompt: cached.prompt, count: cached.count, fromCache: true });
    }

    const rules = await AiRule.find({ isActive: true }).sort({ ruleNumber: 1 });

    if (rules.length === 0) {
      return res.json({ success: true, prompt: '', count: 0 });
    }

    let prompt = '\n\nFOLLOW-UP RULES (CRITICAL - VIOLATING THESE IS FORBIDDEN):';
    rules.forEach((rule) => {
      prompt += `\n\nRULE ${rule.ruleNumber} - ${rule.title}:`;
      prompt += `\n${rule.content}`;
    });

    // Cache it
    await setJSON(RULES_CACHE_KEY, { prompt, count: rules.length }, RULES_CACHE_TTL);

    return res.json({ success: true, prompt, count: rules.length });
  } catch (error) {
    console.error('Get rules for prompt error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Get all rules (for admin listing)
 * GET /api/ai/rules
 */
const getAllRules = async (req, res) => {
  try {
    const rules = await AiRule.find().sort({ ruleNumber: 1 });
    return res.json({ success: true, data: rules });
  } catch (error) {
    console.error('Get all rules error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Create a new rule
 * POST /api/ai/rules
 */
const createRule = async (req, res) => {
  try {
    const { ruleNumber, title, content, category, source } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    // Auto-assign rule number if not provided
    let num = ruleNumber;
    if (!num) {
      const lastRule = await AiRule.findOne().sort({ ruleNumber: -1 });
      num = lastRule ? lastRule.ruleNumber + 1 : 1;
    }

    const rule = new AiRule({
      ruleNumber: num,
      title: title.trim(),
      content: content.trim(),
      category: category || 'general',
      source: source || 'training',
      isActive: true,
    });

    await rule.save();
    await clearCache(RULES_CACHE_KEY);
    
    // Emit Socket.IO event to notify clients
    if (global.io) {
      global.io.emit('ai_rules_updated', { action: 'create', ruleNumber: rule.ruleNumber });
    }
    
    return res.json({ success: true, data: rule });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: `Rule number ${req.body.ruleNumber} already exists` });
    }
    console.error('Create rule error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Update a rule by ID
 * PUT /api/ai/rules/:id
 */
const updateRule = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, isActive, ruleNumber } = req.body;

    const rule = await AiRule.findById(id);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }

    if (title !== undefined) rule.title = title.trim();
    if (content !== undefined) rule.content = content.trim();
    if (category !== undefined) rule.category = category;
    if (isActive !== undefined) rule.isActive = isActive;
    if (ruleNumber !== undefined) rule.ruleNumber = ruleNumber;

    await rule.save();
    await clearCache(RULES_CACHE_KEY);
    
    // Emit Socket.IO event to notify clients
    if (global.io) {
      global.io.emit('ai_rules_updated', { action: 'update', ruleNumber: rule.ruleNumber });
    }
    
    return res.json({ success: true, data: rule });
  } catch (error) {
    console.error('Update rule error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Update a rule by rule number (used by training mode)
 * PUT /api/ai/rules/by-number/:ruleNumber
 */
const updateRuleByNumber = async (req, res) => {
  try {
    const ruleNumber = parseInt(req.params.ruleNumber);
    const { title, content, category, isActive } = req.body;

    const rule = await AiRule.findOne({ ruleNumber });
    if (!rule) {
      return res.status(404).json({ success: false, message: `Rule ${ruleNumber} not found` });
    }

    if (title !== undefined) rule.title = title.trim();
    if (content !== undefined) rule.content = content.trim();
    if (category !== undefined) rule.category = category;
    if (isActive !== undefined) rule.isActive = isActive;

    await rule.save();
    await clearCache(RULES_CACHE_KEY);
    
    // Emit Socket.IO event to notify clients
    if (global.io) {
      global.io.emit('ai_rules_updated', { action: 'update', ruleNumber: rule.ruleNumber });
    }
    
    return res.json({ success: true, data: rule });
  } catch (error) {
    console.error('Update rule by number error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Delete a rule
 * DELETE /api/ai/rules/:id
 */
const deleteRule = async (req, res) => {
  try {
    const { id } = req.params;
    const rule = await AiRule.findByIdAndDelete(id);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }
    await clearCache(RULES_CACHE_KEY);
    
    // Emit Socket.IO event to notify clients
    if (global.io) {
      global.io.emit('ai_rules_updated', { action: 'delete', ruleNumber: rule.ruleNumber });
    }
    
    return res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    console.error('Delete rule error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Seed initial rules from an array (for migration from hardcoded rules)
 * POST /api/ai/rules/seed
 */
const seedRules = async (req, res) => {
  try {
    const { rules } = req.body;
    if (!rules || !Array.isArray(rules)) {
      return res.status(400).json({ success: false, message: 'Rules array is required' });
    }

    const results = [];
    for (const r of rules) {
      const existing = await AiRule.findOne({ ruleNumber: r.ruleNumber });
      if (existing) {
        // Update existing
        existing.title = r.title;
        existing.content = r.content;
        existing.category = r.category || 'general';
        existing.source = r.source || 'system';
        await existing.save();
        results.push({ ruleNumber: r.ruleNumber, action: 'updated' });
      } else {
        // Create new
        await AiRule.create({
          ruleNumber: r.ruleNumber,
          title: r.title,
          content: r.content,
          category: r.category || 'general',
          source: r.source || 'system',
          isActive: true,
        });
        results.push({ ruleNumber: r.ruleNumber, action: 'created' });
      }
    }

    await clearCache(RULES_CACHE_KEY);
    
    // Emit Socket.IO event to notify clients
    if (global.io) {
      global.io.emit('ai_rules_updated', { action: 'seed', count: results.length });
    }
    
    return res.json({ success: true, results });
  } catch (error) {
    console.error('Seed rules error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getRulesForPrompt,
  getAllRules,
  createRule,
  updateRule,
  updateRuleByNumber,
  deleteRule,
  seedRules,
};
