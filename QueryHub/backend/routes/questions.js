const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   POST /api/questions
// @desc    Create a new question
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { title, content, category, tags, isAnonymous } = req.body;

    const question = await Question.create({
      title,
      content,
      category,
      tags: tags.map(tag => tag.toLowerCase()),
      author: req.user._id,
      isAnonymous
    });

    // Increment user's questions count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { questionsCount: 1 }
    });

    res.status(201).json(question);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/questions
// @desc    Get all questions
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      tag, 
      search, 
      sort = 'newest' 
    } = req.query;

    let query = {};
    
    // Filter by category
    if (category) {
      query.category = category;
    }
    
    // Filter by tag
    if (tag) {
      query.tags = tag.toLowerCase();
    }
    
    // Search in title and content
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort options
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'most-voted':
        sortOption = { upvotesCount: -1 };
        break;
      case 'most-answered':
        sortOption = { answersCount: -1 };
        break;
      case 'most-viewed':
        sortOption = { views: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const questions = await Question.find(query)
      .populate('author', 'name username avatar')
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean()
      .exec();

    // Add virtual fields
    const questionsWithCounts = questions.map(q => ({
      ...q,
      upvotesCount: q.upvotes ? q.upvotes.length : 0,
      downvotesCount: q.downvotes ? q.downvotes.length : 0,
      voteScore: (q.upvotes ? q.upvotes.length : 0) - (q.downvotes ? q.downvotes.length : 0)
    }));

    const total = await Question.countDocuments(query);

    res.json({
      questions: questionsWithCounts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalQuestions: total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/questions/:id
// @desc    Get single question
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    // Use findByIdAndUpdate with atomic increment to prevent race conditions
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('author', 'name username avatar bio')
      .populate('bestAnswer');

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Get answers for this question
    const answers = await Answer.find({ question: question._id })
      .populate('author', 'name username avatar bio')
      .sort({ isBestAnswer: -1, createdAt: -1 });

    res.json({
      question: {
        ...question.toObject(),
        upvotesCount: question.upvotes.length,
        downvotesCount: question.downvotes.length,
        voteScore: question.upvotes.length - question.downvotes.length
      },
      answers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/questions/:id
// @desc    Update a question
// @access  Private (Question owner only)
router.put('/:id', protect, async (req, res) => {
  try {
    let question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check if user is the author
    if (question.author.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    question = await Question.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('author', 'name username avatar');

    res.json(question);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/questions/:id
// @desc    Delete a question
// @access  Private (Question owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check if user is the author
    if (question.author.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await question.deleteOne();
    
    // Decrement user's questions count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { questionsCount: -1 }
    });

    res.json({ message: 'Question removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/questions/:id/upvote
// @desc    Upvote a question
// @access  Private
router.post('/:id/upvote', protect, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check if already upvoted
    const alreadyUpvoted = question.upvotes.includes(req.user._id);
    const alreadyDownvoted = question.downvotes.includes(req.user._id);

    if (alreadyUpvoted) {
      // Remove upvote
      question.upvotes.pull(req.user._id);
    } else {
      // Add upvote
      question.upvotes.push(req.user._id);
      // Remove downvote if exists
      if (alreadyDownvoted) {
        question.downvotes.pull(req.user._id);
      }
    }

    await question.save();

    res.json({
      upvotesCount: question.upvotes.length,
      downvotesCount: question.downvotes.length,
      voteScore: question.upvotes.length - question.downvotes.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/questions/:id/downvote
// @desc    Downvote a question
// @access  Private
router.post('/:id/downvote', protect, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check if already downvoted
    const alreadyDownvoted = question.downvotes.includes(req.user._id);
    const alreadyUpvoted = question.upvotes.includes(req.user._id);

    if (alreadyDownvoted) {
      // Remove downvote
      question.downvotes.pull(req.user._id);
    } else {
      // Add downvote
      question.downvotes.push(req.user._id);
      // Remove upvote if exists
      if (alreadyUpvoted) {
        question.upvotes.pull(req.user._id);
      }
    }

    await question.save();

    res.json({
      upvotesCount: question.upvotes.length,
      downvotesCount: question.downvotes.length,
      voteScore: question.upvotes.length - question.downvotes.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/questions/user/:userId
// @desc    Get questions by user
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const questions = await Question.find({ author: req.params.userId })
      .populate('author', 'name username avatar')
      .sort({ createdAt: -1 });

    res.json(questions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;