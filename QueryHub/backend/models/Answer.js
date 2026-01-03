const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Please add content'],
    minlength: [10, 'Content must be at least 10 characters']
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  downvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isBestAnswer: {
    type: Boolean,
    default: false
  },
  comments: [{
    content: {
      type: String,
      required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Virtual for vote count
answerSchema.virtual('upvotesCount').get(function() {
  return this.upvotes.length;
});

answerSchema.virtual('downvotesCount').get(function() {
  return this.downvotes.length;
});

answerSchema.virtual('voteScore').get(function() {
  return this.upvotes.length - this.downvotes.length;
});

module.exports = mongoose.model('Answer', answerSchema);