const mongoose = require('mongoose');

const aiKnowledgeSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    index: true,
  },
  answer: {
    type: String,
    required: true,
  },
  keywords: [{
    type: String,
    index: true,
  }],
  category: {
    type: String,
    default: 'general',
    enum: ['pricing', 'availability', 'booking', 'requirements', 'features', 'location', 'general'],
    index: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
    index: true,
  },
  useCount: {
    type: Number,
    default: 0,
  },
  source: {
    type: String,
    default: 'ai_conversation',
    enum: ['ai_conversation', 'manual', 'corrected'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Text index for search
aiKnowledgeSchema.index({ question: 'text', answer: 'text', keywords: 'text' });

// Pre-save: update updatedAt and extract keywords
aiKnowledgeSchema.pre('save', function (next) {
  this.updatedAt = new Date();

  // Auto-extract keywords if not provided
  if (!this.keywords || this.keywords.length === 0) {
    this.keywords = extractKeywords(this.question);
  }

  next();
});

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

module.exports = mongoose.model('AiKnowledge', aiKnowledgeSchema);
