const mongoose = require('mongoose');

const documentSuggestionSchema = new mongoose.Schema({
  // Document identification
  document_id: {
    type: String,
    required: true,
    index: true
  },
  
  // Chatbot association (for multi-tenant support)
  chatbot_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chatbot',
    index: true
  },
  
  // Section information
  section_name: {
    type: String,
    required: true,
    trim: true
  },
  
  section_type: {
    type: String,
    default: 'content',
    enum: [
      'content',
      'heading', 
      'skills',
      'technical_skills',
      'experience',
      'work_experience',
      'education',
      'projects',
      'contact',
      'contact_info',
      'summary',
      'about',
      'certifications',
      'achievements'
    ]
  },
  
  // Generated suggestions
  suggestions: [{
    type: String,
    trim: true,
    maxlength: 500
  }],
  
  // Metadata
  generated_at: {
    type: Date,
    default: Date.now
  },
  
  updated_at: {
    type: Date,
    default: Date.now
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['active', 'draft', 'disabled'],
    default: 'active'
  },
  
  // Generation metadata
  generation_method: {
    type: String,
    enum: ['ai_generated', 'manual', 'hybrid'],
    default: 'ai_generated'
  },
  
  // Quality metrics
  quality_score: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },
  
  // Usage statistics
  usage_stats: {
    times_used: {
      type: Number,
      default: 0
    },
    last_used: {
      type: Date,
      default: null
    },
    user_feedback: [{
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      created_at: {
        type: Date,
        default: Date.now
      }
    }]
  }
}, {
  timestamps: true,
  collection: 'document_suggestions'
});

// Compound indexes for efficient queries
documentSuggestionSchema.index({ document_id: 1, section_name: 1 }, { unique: true });
documentSuggestionSchema.index({ chatbot_id: 1, status: 1 });
documentSuggestionSchema.index({ generated_at: -1 });

// Instance methods
documentSuggestionSchema.methods.incrementUsage = function() {
  this.usage_stats.times_used += 1;
  this.usage_stats.last_used = new Date();
  return this.save();
};

documentSuggestionSchema.methods.addFeedback = function(rating, comment = '') {
  this.usage_stats.user_feedback.push({
    rating,
    comment,
    created_at: new Date()
  });
  return this.save();
};

// Static methods
documentSuggestionSchema.statics.findByDocument = function(documentId, status = 'active') {
  return this.find({ 
    document_id: documentId, 
    status: status 
  }).sort({ section_name: 1 });
};

documentSuggestionSchema.statics.findByChatbot = function(chatbotId, status = 'active') {
  return this.find({ 
    chatbot_id: chatbotId, 
    status: status 
  }).sort({ generated_at: -1 });
};

documentSuggestionSchema.statics.getPopularSuggestions = function(chatbotId, limit = 10) {
  return this.find({ 
    chatbot_id: chatbotId, 
    status: 'active',
    'usage_stats.times_used': { $gt: 0 }
  })
  .sort({ 'usage_stats.times_used': -1 })
  .limit(limit);
};

// Virtual for average rating
documentSuggestionSchema.virtual('averageRating').get(function() {
  if (!this.usage_stats.user_feedback || this.usage_stats.user_feedback.length === 0) {
    return null;
  }
  
  const totalRating = this.usage_stats.user_feedback.reduce((sum, feedback) => sum + feedback.rating, 0);
  return totalRating / this.usage_stats.user_feedback.length;
});

// Pre-save middleware
documentSuggestionSchema.pre('save', function(next) {
  if (this.isModified('suggestions')) {
    this.updated_at = new Date();
  }
  next();
});

// Pre-update middleware
documentSuggestionSchema.pre(['updateOne', 'findOneAndUpdate'], function(next) {
  this.set({ updated_at: new Date() });
  next();
});

// Export model
const DocumentSuggestion = mongoose.model('DocumentSuggestion', documentSuggestionSchema);

module.exports = DocumentSuggestion;
