const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Question = require('../models/Question');
const jwt = require('jsonwebtoken');

// Auth middleware for bookmarks
const protect = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    const JWT_SECRET = process.env.JWT_SECRET || 'queryhub_secret_2024';
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// @route   POST /api/questions/:id/bookmark
// @desc    Bookmark a question
// @access  Private
router.post('/questions/:id/bookmark', protect, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ 
        success: false,
        message: 'Question not found' 
      });
    }

    const user = await User.findById(req.user._id);
    
    // Check if already bookmarked (convert both to string for comparison)
    const questionId = req.params.id;
    const isBookmarked = user.bookmarks.some(
      bookmarkId => bookmarkId.toString() === questionId.toString()
    );
    
    if (isBookmarked) {
      // Remove bookmark
      user.bookmarks = user.bookmarks.filter(
        bookmarkId => bookmarkId.toString() !== questionId.toString()
      );
      await user.save();
      
      return res.json({
        success: true,
        bookmarked: false,
        message: 'Question removed from bookmarks'
      });
    } else {
      // Add bookmark
      user.bookmarks.push(questionId);
      await user.save();
      
      return res.json({
        success: true,
        bookmarked: true,
        message: 'Question bookmarked'
      });
    }
    
  } catch (error) {
    console.error('Bookmark Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @route   GET /api/users/:id/bookmarks
// @desc    Get user's bookmarked questions
// @access  Private (User's own bookmarks)
router.get('/users/:id/bookmarks', protect, async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    const user = await User.findById(req.user._id).populate({
      path: 'bookmarks',
      populate: {
        path: 'author',
        select: 'name username avatar'
      }
    });
    
    res.json({
      success: true,
      bookmarks: user.bookmarks || []
    });
    
  } catch (error) {
    console.error('Get Bookmarks Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/questions/:id/bookmark-status
// @desc    Check if question is bookmarked by user
// @access  Private
router.get('/questions/:id/bookmark-status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const questionId = req.params.id;
    // Convert both to string for comparison
    const isBookmarked = user.bookmarks.some(
      bookmarkId => bookmarkId.toString() === questionId.toString()
    );
    
    res.json({
      success: true,
      bookmarked: isBookmarked
    });
    
  } catch (error) {
    console.error('Bookmark Status Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;