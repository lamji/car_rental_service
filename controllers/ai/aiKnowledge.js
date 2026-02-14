const AiKnowledge = require('../../models/aiKnowledge');
const { getJSON, setJSON, clearCache } = require('../../utils/redis');

const KB_CACHE_PREFIX = 'ai_kb:';
const KB_CACHE_TTL = 3600; // 1 hour

/** Invalidate all KB search caches when data changes */
async function invalidateKBCache() {
  // Clear the full list cache
  await clearCache(`${KB_CACHE_PREFIX}all`);
  // Note: individual search caches expire via TTL
}

/**
 * Save a Q&A pair from AI conversation
 * POST /api/ai/knowledge
 */
const saveKnowledge = async (req, res) => {
  try {
    const { question, answer, category, keywords } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ success: false, message: 'Question and answer are required' });
    }

    // Skip very short questions
    if (question.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Question too short' });
    }

    // Check for duplicate — find by similar keywords
    const autoKeywords = extractKeywords(question);
    const existing = await AiKnowledge.findOne({
      keywords: { $in: autoKeywords },
      $expr: {
        $gte: [
          { $size: { $setIntersection: ['$keywords', autoKeywords] } },
          { $ceil: { $multiply: [{ $size: '$keywords' }, 0.6] } },
        ],
      },
    });

    if (existing) {
      // Update existing entry with newer answer (unless it was manually corrected)
      if (existing.source !== 'corrected') {
        existing.answer = answer;
        existing.updatedAt = new Date();
        await existing.save();
        await invalidateKBCache();
        return res.json({ success: true, data: existing, updated: true });
      }
      // If corrected, don't overwrite — just return it
      return res.json({ success: true, data: existing, skipped: true });
    }

    const entry = new AiKnowledge({
      question: question.trim(),
      answer: answer.trim(),
      category: category || 'general',
      keywords: keywords || autoKeywords,
      source: 'ai_conversation',
    });

    await entry.save();
    await invalidateKBCache();
    return res.json({ success: true, data: entry });
  } catch (error) {
    console.error('Save knowledge error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Search knowledge base for relevant Q&A pairs
 * GET /api/ai/knowledge/search?q=<query>&limit=5
 * Uses Redis cache for fast repeated queries.
 */
const searchKnowledge = async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;

    if (!q || typeof q !== 'string') {
      return res.json({ success: true, data: [] });
    }

    const queryKeywords = extractKeywords(q);
    if (queryKeywords.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Check Redis cache first — key based on sorted keywords for consistency
    const cacheKey = `${KB_CACHE_PREFIX}search:${queryKeywords.sort().join(',')}:${limit}`;
    const cached = await getJSON(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, fromCache: true });
    }

    // Find entries that share keywords with the query
    const results = await AiKnowledge.aggregate([
      {
        $match: {
          keywords: { $in: queryKeywords },
        },
      },
      {
        $addFields: {
          matchCount: {
            $size: { $setIntersection: ['$keywords', queryKeywords] },
          },
          totalKeywords: {
            $size: { $setUnion: ['$keywords', queryKeywords] },
          },
        },
      },
      {
        $addFields: {
          relevance: { $divide: ['$matchCount', '$totalKeywords'] },
        },
      },
      { $match: { relevance: { $gt: 0.15 } } },
      { $sort: { isVerified: -1, relevance: -1, useCount: -1 } },
      { $limit: parseInt(limit) },
    ]);

    // Cache the results in Redis
    if (results.length > 0) {
      await setJSON(cacheKey, results, KB_CACHE_TTL);

      // Increment useCount (non-blocking)
      const ids = results.map(r => r._id);
      AiKnowledge.updateMany(
        { _id: { $in: ids } },
        { $inc: { useCount: 1 } }
      ).catch(() => {});
    }

    return res.json({ success: true, data: results });
  } catch (error) {
    console.error('Search knowledge error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Get all knowledge entries (for admin/manual curation)
 * GET /api/ai/knowledge?page=1&limit=50&category=pricing&verified=true
 */
const getAllKnowledge = async (req, res) => {
  try {
    const { page = 1, limit = 50, category, verified, source } = req.query;
    const query = {};

    if (category) query.category = category;
    if (verified !== undefined) query.isVerified = verified === 'true';
    if (source) query.source = source;

    const total = await AiKnowledge.countDocuments(query);
    const data = await AiKnowledge.find(query)
      .sort({ updatedAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    return res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get knowledge error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Update a knowledge entry (for manual correction)
 * PUT /api/ai/knowledge/:id
 */
const updateKnowledge = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, category, keywords, isVerified } = req.body;

    const entry = await AiKnowledge.findById(id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    // Mark as corrected if answer is being changed
    const originalAnswer = entry.answer;
    if (answer !== undefined && answer.trim() !== originalAnswer) {
      entry.source = 'corrected';
    }

    if (question !== undefined) entry.question = question.trim();
    if (answer !== undefined) entry.answer = answer.trim();
    if (category !== undefined) entry.category = category;
    if (keywords !== undefined) entry.keywords = keywords;
    if (isVerified !== undefined) entry.isVerified = isVerified;

    await entry.save();
    await invalidateKBCache();
    return res.json({ success: true, data: entry });
  } catch (error) {
    console.error('Update knowledge error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Delete a knowledge entry
 * DELETE /api/ai/knowledge/:id
 */
const deleteKnowledge = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await AiKnowledge.findByIdAndDelete(id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }
    await invalidateKBCache();
    return res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    console.error('Delete knowledge error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Create a manual knowledge entry
 * POST /api/ai/knowledge/manual
 */
const createManualKnowledge = async (req, res) => {
  try {
    const { question, answer, category, keywords } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ success: false, message: 'Question and answer are required' });
    }

    const entry = new AiKnowledge({
      question: question.trim(),
      answer: answer.trim(),
      category: category || 'general',
      keywords: keywords || extractKeywords(question),
      source: 'manual',
      isVerified: true, // Manual entries are pre-verified
    });

    await entry.save();
    await invalidateKBCache();
    return res.json({ success: true, data: entry });
  } catch (error) {
    console.error('Create manual knowledge error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/** Extract meaningful keywords from text */
function extractKeywords(text) {
  const stopWords = new Set([
    'i', 'me', 'my', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'could', 'should', 'may', 'might', 'can', 'shall', 'to',
    'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'it', 'its',
    'this', 'that', 'these', 'those', 'and', 'or', 'but', 'if', 'then',
    'so', 'than', 'too', 'very', 'just', 'about', 'what', 'how', 'when',
    'where', 'who', 'which', 'there', 'here', 'not', 'no', 'yes', 'up',
    'out', 'also', 'more', 'some', 'any', 'all', 'each', 'every', 'much',
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w))
    .filter((w, i, arr) => arr.indexOf(w) === i);
}

module.exports = {
  saveKnowledge,
  searchKnowledge,
  getAllKnowledge,
  updateKnowledge,
  deleteKnowledge,
  createManualKnowledge,
};
