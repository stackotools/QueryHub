const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const { protect } = require('../middleware/auth');

// @route   GET /api/users
// @desc    Get all users
// @access  Public
router.get('/', async (req, res) => {
  try {
    const users = await User.find({})
      .select('name username avatar bio location questionsCount answersCount upvotesReceived followers following')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Get user's questions
    const questions = await Question.find({ author: user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get user's answers
    const answers = await Answer.find({ author: user._id })
      .populate('question', 'title')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        followersCount: user.followers?.length || 0,
        followingCount: user.following?.length || 0,
        bookmarksCount: user.bookmarks?.length || 0
      },
      questions,
      answers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   GET /api/users/:id/questions
// @desc    Get all questions by user
// @access  Public
router.get('/:id/questions', async (req, res) => {
  try {
    const questions = await Question.find({ author: req.params.id })
      .populate('author', 'name username avatar')
      .sort({ createdAt: -1 });

    res.json(questions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id/answers
// @desc    Get all answers by user
// @access  Public
router.get('/:id/answers', async (req, res) => {
  try {
    const answers = await Answer.find({ author: req.params.id })
      .populate('question', 'title')
      .populate('author', 'name username avatar')
      .sort({ createdAt: -1 });

    res.json(answers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/search/:query
// @desc    Search users
// @access  Public
router.get('/search/:query', async (req, res) => {
  try {
    const users = await User.find({
      $or: [
        { name: { $regex: req.params.query, $options: 'i' } },
        { username: { $regex: req.params.query, $options: 'i' } }
      ]
    })
    .select('name username avatar bio location followers following questionsCount answersCount')
    .limit(20);

    res.json({
      success: true,
      users,
      count: users.length
    });
  } catch (error) {
    console.error('Search Users Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   GET /api/users/:id/followers-list
// @desc    Get detailed followers list
// @access  Public
router.get('/:id/followers-list', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate({
        path: 'followers',
        select: 'name username avatar bio questionsCount answersCount followers'
      });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      followers: user.followers
    });
  } catch (error) {
    console.error('Get Followers List Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   GET /api/users/:id/following-list
// @desc    Get detailed following list
// @access  Public
router.get('/:id/following-list', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate({
        path: 'following',
        select: 'name username avatar bio questionsCount answersCount followers'
      });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      following: user.following
    });
  } catch (error) {
    console.error('Get Following List Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;