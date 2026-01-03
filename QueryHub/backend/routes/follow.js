// backend/routes/follow.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Question = require('../models/Question');

// MIDDLEWARE: Verify Token
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'queryhub_secret_2024';
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// @route   POST /api/follow/:id/follow
// @desc    Follow/Unfollow a user
// @access  Private
router.post('/:id/follow', authMiddleware, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;
    
    // Check if trying to follow self
    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot follow yourself' 
      });
    }

    // Check if target user exists
    const userToFollow = await User.findById(targetUserId);
    if (!userToFollow) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Get current user with fresh data
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'Current user not found' 
      });
    }

    // Check if already following (using string comparison for ObjectId)
    const isFollowing = currentUser.following.some(
      id => id.toString() === targetUserId
    );

    if (isFollowing) {
      // Unfollow - use atomic operations to prevent race conditions
      await User.findByIdAndUpdate(currentUserId, {
        $pull: { following: targetUserId }
      });
      
      await User.findByIdAndUpdate(targetUserId, {
        $pull: { followers: currentUserId }
      });
      
      // Get updated counts
      const updatedCurrentUser = await User.findById(currentUserId);
      const updatedTargetUser = await User.findById(targetUserId);
      
      return res.json({
        success: true,
        following: false,
        message: 'Unfollowed successfully',
        followersCount: updatedTargetUser.followers.length,
        followingCount: updatedCurrentUser.following.length
      });
    } else {
      // Follow - use atomic operations with $addToSet to prevent duplicates
      await User.findByIdAndUpdate(currentUserId, {
        $addToSet: { following: targetUserId }
      });
      
      await User.findByIdAndUpdate(targetUserId, {
        $addToSet: { followers: currentUserId }
      });
      
      // Get updated counts
      const updatedCurrentUser = await User.findById(currentUserId);
      const updatedTargetUser = await User.findById(targetUserId);
      
      return res.json({
        success: true,
        following: true,
        message: 'Followed successfully',
        followersCount: updatedTargetUser.followers.length,
        followingCount: updatedCurrentUser.following.length
      });
    }
    
  } catch (error) {
    console.error('Follow Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// @route   GET /api/follow/:id/follow-status
// @desc    Check follow status
// @access  Private
router.get('/:id/follow-status', authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Use string comparison for ObjectId
    const isFollowing = currentUser.following.some(
      id => id.toString() === req.params.id
    );
    
    res.json({
      success: true,
      isFollowing: isFollowing
    });
    
  } catch (error) {
    console.error('Follow Status Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   GET /api/follow/:id/followers
// @desc    Get user's followers
// @access  Public
router.get('/:id/followers', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'name username avatar bio questionsCount answersCount')
      .select('followers');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      followers: user.followers || [],
      count: user.followers.length
    });
    
  } catch (error) {
    console.error('Get Followers Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   GET /api/follow/:id/following
// @desc    Get users being followed
// @access  Public
router.get('/:id/following', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('following', 'name username avatar bio questionsCount answersCount')
      .select('following');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      following: user.following || [],
      count: user.following.length
    });
    
  } catch (error) {
    console.error('Get Following Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   GET /api/follow/:id/follow-stats
// @desc    Get follow statistics
// @access  Public
router.get('/:id/follow-stats', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      followersCount: user.followers.length,
      followingCount: user.following.length
    });
    
  } catch (error) {
    console.error('Follow Stats Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   GET /api/follow/feed
// @desc    Get questions from users you follow
// @access  Private
router.get('/feed', authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    
    const questions = await Question.find({
      author: { $in: currentUser.following }
    })
    .populate('author', 'name username avatar')
    .sort({ createdAt: -1 })
    .limit(50);
    
    res.json({
      success: true,
      questions,
      count: questions.length
    });
    
  } catch (error) {
    console.error('Follow Feed Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;