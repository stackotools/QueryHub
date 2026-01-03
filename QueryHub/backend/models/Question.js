const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [150, 'Title cannot be more than 150 characters']
  },
  content: {
    type: String,
    required: [true, 'Please add content'],
    minlength: [30, 'Content must be at least 30 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Technology',
      'Programming',
      'Science',
      'Mathematics',
      'Business',
      'Career',
      'Education',
      'Health',
      'Lifestyle',
      'Arts & Culture',
      'Sports',
      'Other'
    ]
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  downvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  },
  answersCount: {
    type: Number,
    default: 0
  },
  isAnswered: {
    type: Boolean,
    default: false
  },
  bestAnswer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answer'
  },
  isAnonymous: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Virtual for vote count
questionSchema.virtual('upvotesCount').get(function() {
  return this.upvotes.length;
});

questionSchema.virtual('downvotesCount').get(function() {
  return this.downvotes.length;
});

questionSchema.virtual('voteScore').get(function() {
  return this.upvotes.length - this.downvotes.length;
});

module.exports = mongoose.model('Question', questionSchema);