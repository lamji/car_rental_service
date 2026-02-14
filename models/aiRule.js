const mongoose = require('mongoose');

const aiRuleSchema = new mongoose.Schema({
  ruleNumber: {
    type: Number,
    required: true,
    unique: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  category: {
    type: String,
    default: 'general',
    enum: ['pricing', 'availability', 'response_style', 'security', 'formatting', 'general'],
    index: true,
  },
  source: {
    type: String,
    default: 'system',
    enum: ['system', 'training'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

aiRuleSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('AiRule', aiRuleSchema);
