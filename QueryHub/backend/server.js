const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./models/User');
const Question = require('./models/Question');
const Answer = require('./models/Answer');
const followRouter = require('./routes/follow');
const bookmarkRouter = require('./routes/bookmarks');
const answersRouter = require('./routes/answers');

const app = express();

// ============ MIDDLEWARE ============
// Simple CORS - सभी allow करो
app.use(cors({
  origin: '*',  // सभी websites allow
  credentials: true
}));
app.use(express.json());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'queryhub_secret_2024';

// Generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};

// Normalize external URL - ensures protocol exists, idempotent
const normalizeExternalUrl = (input) => {
  if (!input || typeof input !== 'string') {
    return null;
  }
  
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }
  
  // If already has protocol, return as-is
  if (trimmed.toLowerCase().startsWith('http://') || trimmed.toLowerCase().startsWith('https://')) {
    return trimmed;
  }
  
  // Otherwise, prepend https://
  return `https://${trimmed}`;
};

// Auth Middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ 
      success: false,
      message: 'Invalid token' 
    });
  }
};

// ============ DATABASE CONNECTION ============
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
.then(() => {
  console.log('✅ MongoDB Connected Successfully');
})
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err.message);
});

// ============ AUTH ROUTES ============

// REGISTER USER
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide all fields' 
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists' 
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      bio: '',
      location: ''
    });

    const token = generateToken(user._id);

    // Ensure arrays are initialized (safety check)
    const followers = Array.isArray(user.followers) ? user.followers : [];
    const following = Array.isArray(user.following) ? user.following : [];
    const bookmarks = Array.isArray(user.bookmarks) ? user.bookmarks : [];

    res.status(201).json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      location: user.location,
      questionsCount: user.questionsCount || 0,
      answersCount: user.answersCount || 0,
      upvotesReceived: user.upvotesReceived || 0,
      followersCount: followers.length,
      followingCount: following.length,
      following: following.map(id => id.toString()), // Array of user IDs
      bookmarksCount: bookmarks.length,
      token,
      message: 'Account created successfully'
    });

  } catch (error) {
    console.error('Register Error:', error);
    console.error('Error stack:', error.stack);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      // Duplicate key error (email or username)
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        success: false,
        message: `${field === 'email' ? 'Email' : 'Username'} already exists` 
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        message: messages.join(', ') 
      });
    }
    
    // Return detailed error message for debugging
    res.status(500).json({ 
      success: false,
      message: error.message || 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// LOGIN USER
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide email and password' 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Check password (use model method for consistency)
    if (!user.matchPassword(password)) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    const token = generateToken(user._id);

    // Ensure arrays are initialized (safety check)
    const followers = Array.isArray(user.followers) ? user.followers : [];
    const following = Array.isArray(user.following) ? user.following : [];
    const bookmarks = Array.isArray(user.bookmarks) ? user.bookmarks : [];
    
    res.json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      location: user.location,
      website: user.website,
      twitter: user.twitter,
      github: user.github,
      linkedin: user.linkedin,
      questionsCount: user.questionsCount || 0,
      answersCount: user.answersCount || 0,
      upvotesReceived: user.upvotesReceived || 0,
      followersCount: followers.length,
      followingCount: following.length,
      following: following.map(id => id.toString()), // Array of user IDs
      bookmarksCount: bookmarks.length,
      token,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// GET USER PROFILE
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // ✅ Calculate total upvotes RECEIVED on user's content
    const [questionUpvotesAgg, answerUpvotesAgg] = await Promise.all([
      Question.aggregate([
        { $match: { author: user._id } },
        {
          $project: {
            upvotesCount: {
              $size: {
                $ifNull: ['$upvotes', []]
              }
            }
          }
        },
        { $group: { _id: null, total: { $sum: '$upvotesCount' } } }
      ]),
      Answer.aggregate([
        { $match: { author: user._id } },
        {
          $project: {
            upvotesCount: {
              $size: {
                $ifNull: ['$upvotes', []]
              }
            }
          }
        },
        { $group: { _id: null, total: { $sum: '$upvotesCount' } } }
      ])
    ]);

    const questionUpvotes =
      questionUpvotesAgg && questionUpvotesAgg.length > 0
        ? questionUpvotesAgg[0].total
        : 0;
    const answerUpvotes =
      answerUpvotesAgg && answerUpvotesAgg.length > 0
        ? answerUpvotesAgg[0].total
        : 0;

    const totalUpvotesReceived = questionUpvotes + answerUpvotes;

    // ✅ Calculate DISTINCT existing bookmarked questions
    // This ignores duplicates in the bookmarks array and excludes deleted questions.
    const bookmarksCount = await Question.countDocuments({
      _id: { $in: user.bookmarks || [] }
    });

    res.json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      location: user.location,
      website: user.website,
      twitter: user.twitter,
      github: user.github,
      linkedin: user.linkedin,
      questionsCount: user.questionsCount,
      answersCount: user.answersCount,
      upvotesReceived: totalUpvotesReceived,
      followersCount: user.followers.length,
      followingCount: user.following.length,
      bookmarksCount,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Profile Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// UPDATE PROFILE
app.put('/api/auth/update', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    user.name = req.body.name || user.name;
    user.bio = req.body.bio || user.bio;
    user.location = req.body.location || user.location;
    // Normalize external URLs before saving (allows clearing by sending empty string)
    if (req.body.hasOwnProperty('website')) {
      user.website = normalizeExternalUrl(req.body.website);
    }
    if (req.body.hasOwnProperty('twitter')) {
      user.twitter = normalizeExternalUrl(req.body.twitter);
    }
    if (req.body.hasOwnProperty('github')) {
      user.github = normalizeExternalUrl(req.body.github);
    }
    if (req.body.hasOwnProperty('linkedin')) {
      user.linkedin = normalizeExternalUrl(req.body.linkedin);
    }
    user.avatar = req.body.avatar || user.avatar;
    
    await user.save();
    
    // Ensure arrays are initialized (safety check)
    const followers = Array.isArray(user.followers) ? user.followers : [];
    const following = Array.isArray(user.following) ? user.following : [];
    const bookmarks = Array.isArray(user.bookmarks) ? user.bookmarks : [];
    
    // Get token from request header to preserve authentication
    const token = req.header('Authorization')?.replace('Bearer ', '') || generateToken(user._id);
    
    res.json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      location: user.location,
      website: user.website,
      twitter: user.twitter,
      github: user.github,
      linkedin: user.linkedin,
      questionsCount: user.questionsCount || 0,
      answersCount: user.answersCount || 0,
      upvotesReceived: user.upvotesReceived || 0,
      followersCount: followers.length,
      followingCount: following.length,
      bookmarksCount: bookmarks.length,
      token,
      message: 'Profile updated successfully'
    });
    
  } catch (error) {
    console.error('Update Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// ============ USER ROUTES ============

// GET ALL USERS
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({})
      .select('name username avatar bio location questionsCount answersCount followers following')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
      .exec();

    // Add followers count to each user
    const usersWithCounts = users.map(user => ({
      ...user,
      followersCount: user.followers ? user.followers.length : 0,
      followingCount: user.following ? user.following.length : 0
    }));

    res.json({
      success: true,
      users: usersWithCounts
    });
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// GET USER BY ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        followersCount: user.followers.length,
        followingCount: user.following.length,
        bookmarksCount: user.bookmarks.length
      }
    });
  } catch (error) {
    console.error('User Profile Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   GET /api/users/:id/answers
// @desc    Get all answers by user
// @access  Public
app.get('/api/users/:id/answers', async (req, res) => {
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
app.get('/api/users/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    
    // If query is empty, return all users
    let searchQuery = {};
    if (query && query.trim()) {
      searchQuery = {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { username: { $regex: query, $options: 'i' } }
        ]
      };
    }
    
    const users = await User.find(searchQuery)
      .select('name username avatar bio location followers following questionsCount answersCount')
      .limit(20)
      .lean()
      .exec();

    // Add followers count to each user
    const usersWithCounts = users.map(user => ({
      ...user,
      followersCount: user.followers ? user.followers.length : 0,
      followingCount: user.following ? user.following.length : 0
    }));

    res.json({
      success: true,
      users: usersWithCounts,
      count: usersWithCounts.length
    });
  } catch (error) {
    console.error('Search Users Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// ============ QUESTION ROUTES (UPDATED WITH TAG FILTER) ============

// CREATE QUESTION
app.post('/api/questions', authMiddleware, async (req, res) => {
  try {
    const { title, content, tags, category } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ 
        success: false,
        message: 'Title and content are required' 
      });
    }
    
    // Process tags - convert to lowercase and remove duplicates
    const processedTags = tags 
      ? [...new Set(tags.map(tag => tag.trim().toLowerCase()))]
      : [];
    
    const question = await Question.create({
      title,
      content,
      author: req.user._id,
      tags: processedTags,
      category: category || 'general'
    });
    
    // Update user's questions count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { questionsCount: 1 }
    });
    
    const populatedQuestion = await Question.findById(question._id)
      .populate('author', 'name username avatar');
    
    res.status(201).json({
      success: true,
      question: populatedQuestion,
      message: 'Question posted successfully'
    });
    
  } catch (error) {
    console.error('Question Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// ✅ UPDATED: GET ALL QUESTIONS - WITH TAG FILTER SUPPORT
app.get('/api/questions', async (req, res) => {
  try {
    const { search, sort = 'newest', category, tag } = req.query;
    
    let query = {};
    
    // Search in title and content
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // ✅ NEW: Filter by tag (case-insensitive)
    if (tag) {
      const tagLower = tag.toLowerCase().trim();
      // MongoDB: Check if tags array contains this value
      query.tags = tagLower;
    }
    
    // Sorting
    let sortOption = { createdAt: -1 };
    
    if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    } else if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    } else if (sort === 'most-viewed') {
      sortOption = { views: -1, createdAt: -1 };
    } else if (sort === 'most-answered') {
      sortOption = { answersCount: -1, createdAt: -1 };
    } else if (sort === 'most-voted') {
      sortOption = { createdAt: -1 }; // Handle manually after fetching
    }
    
    const questions = await Question.find(query)
      .populate('author', 'name username avatar')
      .sort(sortOption)
      .limit(50)
      .lean()
      .exec();
    
    // Add vote counts and scores
    const questionsWithCounts = questions.map(q => ({
      ...q,
      upvotesCount: q.upvotes ? q.upvotes.length : 0,
      downvotesCount: q.downvotes ? q.downvotes.length : 0,
      voteScore: (q.upvotes ? q.upvotes.length : 0) - (q.downvotes ? q.downvotes.length : 0)
    }));
    
    // Special handling for most-voted sorting
    if (sort === 'most-voted') {
      questionsWithCounts.sort((a, b) => {
        const aScore = a.voteScore;
        const bScore = b.voteScore;
        
        if (bScore === aScore) {
          return (b.views || 0) - (a.views || 0);
        }
        return bScore - aScore;
      });
    }
    
    res.json({
      success: true,
      questions: questionsWithCounts,
      total: questionsWithCounts.length
    });
    
  } catch (error) {
    console.error('Questions Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// GET SINGLE QUESTION
app.get('/api/questions/:id', async (req, res) => {
  try {
    // Validate ObjectId to avoid cast errors
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question ID'
      });
    }
    // Use findByIdAndUpdate with atomic increment to prevent race conditions
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('author', 'name username avatar bio');
    
    if (!question) {
      return res.status(404).json({ 
        success: false,
        message: 'Question not found' 
      });
    }
    
    // Get answers with populated comments
    const answers = await Answer.find({ question: question._id })
      .populate('author', 'name username avatar bio')
      .populate({
        path: 'comments.author',
        select: 'name username avatar'
      })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      question: {
        ...question.toObject(),
        upvotesCount: question.upvotes.length,
        downvotesCount: question.downvotes.length,
        voteScore: question.upvotes.length - question.downvotes.length
      },
      answers
    });
    
  } catch (error) {
    console.error('Question Detail Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @route   GET /api/questions/user/:userId
// @desc    Get questions by user
// @access  Public
app.get('/api/questions/user/:userId', async (req, res) => {
  try {
    // Validate ObjectId to avoid cast errors
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({
        message: 'Invalid user ID'
      });
    }

    const questions = await Question.find({ author: req.params.userId })
      .populate('author', 'name username avatar')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Add vote counts
    const questionsWithCounts = questions.map(q => ({
      ...q,
      upvotesCount: q.upvotes ? q.upvotes.length : 0,
      downvotesCount: q.downvotes ? q.downvotes.length : 0,
      voteScore: (q.upvotes ? q.upvotes.length : 0) - (q.downvotes ? q.downvotes.length : 0)
    }));

    res.json(questionsWithCounts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/questions/:id
// @desc    Delete a question
// @access  Private (Question owner only)
app.delete('/api/questions/:id', authMiddleware, async (req, res) => {
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

    res.json({ success: true, message: 'Question removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/questions/:id/upvote
// @desc    Upvote a question
// @access  Private
app.post('/api/questions/:id/upvote', authMiddleware, async (req, res) => {
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
app.post('/api/questions/:id/downvote', authMiddleware, async (req, res) => {
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

// ✅ NEW: GET TRENDING TOPICS (WEIGHTED SCORE)
app.get('/api/tags/trending', async (req, res) => {
  try {
    // Get all questions with tags and upvotes
    const questions = await Question.find({ tags: { $exists: true, $ne: [] } })
      .select('tags upvotes')
      .lean();
    
    // Calculate weighted scores for each tag
    const tagStats = {};
    
    questions.forEach(question => {
      if (question.tags && Array.isArray(question.tags)) {
        const upvotesCount = question.upvotes ? question.upvotes.length : 0;
        
        question.tags.forEach(tag => {
          if (tag && typeof tag === 'string') {
            const cleanTag = tag.trim().toLowerCase();
            if (cleanTag) {
              if (!tagStats[cleanTag]) {
                tagStats[cleanTag] = {
                  questionCount: 0,
                  totalUpvotes: 0
                };
              }
              tagStats[cleanTag].questionCount += 1;
              tagStats[cleanTag].totalUpvotes += upvotesCount;
            }
          }
        });
      }
    });
    
    // Calculate weighted score for each tag
    // Weight: question count = 1.0, upvotes = 0.5 (adjustable)
    const QUESTION_WEIGHT = 1.0;
    const UPVOTE_WEIGHT = 0.5;
    
    const trendingTags = Object.entries(tagStats)
      .map(([name, stats]) => {
        const score = (stats.questionCount * QUESTION_WEIGHT) + (stats.totalUpvotes * UPVOTE_WEIGHT);
        return {
          name: name.charAt(0).toUpperCase() + name.slice(1),
          count: stats.questionCount,
          score: score
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4); // Top 4 only
    
    res.json({
      success: true,
      tags: trendingTags,
      total: trendingTags.length
    });
    
  } catch (error) {
    console.error('Trending Tags Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// ✅ NEW: GET ALL TAGS FOR DISCOVERY (Full list for "View all topics")
app.get('/api/tags', async (req, res) => {
  try {
    // Get all questions with tags
    const questions = await Question.find({ tags: { $exists: true, $ne: [] } })
      .select('tags')
      .lean();
    
    // Extract and count all tags
    const tagCounts = {};
    questions.forEach(question => {
      if (question.tags && Array.isArray(question.tags)) {
        question.tags.forEach(tag => {
          if (tag && typeof tag === 'string') {
            const cleanTag = tag.trim().toLowerCase();
            if (cleanTag) {
              tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
            }
          }
        });
      }
    });
    
    // Convert to array and sort by count
    const trendingTags = Object.entries(tagCounts)
      .map(([name, count]) => ({ 
        name: name.charAt(0).toUpperCase() + name.slice(1), 
        count 
      }))
      .sort((a, b) => b.count - a.count);
    
    res.json({
      success: true,
      tags: trendingTags,
      total: trendingTags.length
    });
    
  } catch (error) {
    console.error('Tags Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// ============ ANSWER ROUTES ============

// ADD ANSWER
app.post('/api/questions/:id/answers', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const questionId = req.params.id;
    
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ 
        success: false,
        message: 'Question not found' 
      });
    }
    
    const answer = await Answer.create({
      content,
      question: questionId,
      author: req.user._id
    });
    
    // Update question's answers count
    question.answersCount += 1;
    await question.save();
    
    // Update user's answers count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { answersCount: 1 }
    });
    
    const populatedAnswer = await Answer.findById(answer._id)
      .populate('author', 'name username avatar bio');
    
    res.status(201).json({
      success: true,
      answer: populatedAnswer,
      message: 'Answer added successfully'
    });
    
  } catch (error) {
    console.error('Answer Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @route   POST /api/answers/:id/upvote
// @desc    Upvote an answer
// @access  Private
app.post('/api/answers/:id/upvote', authMiddleware, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    // Check if already upvoted
    const alreadyUpvoted = answer.upvotes.includes(req.user._id);
    const alreadyDownvoted = answer.downvotes.includes(req.user._id);

    if (alreadyUpvoted) {
      // Remove upvote
      answer.upvotes.pull(req.user._id);
    } else {
      // Add upvote
      answer.upvotes.push(req.user._id);
      // Remove downvote if exists
      if (alreadyDownvoted) {
        answer.downvotes.pull(req.user._id);
      }
    }

    await answer.save();

    res.json({
      upvotesCount: answer.upvotes.length,
      downvotesCount: answer.downvotes.length,
      voteScore: answer.upvotes.length - answer.downvotes.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/answers/:id/downvote
// @desc    Downvote an answer
// @access  Private
app.post('/api/answers/:id/downvote', authMiddleware, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    // Check if already downvoted
    const alreadyDownvoted = answer.downvotes.includes(req.user._id);
    const alreadyUpvoted = answer.upvotes.includes(req.user._id);

    if (alreadyDownvoted) {
      // Remove downvote
      answer.downvotes.pull(req.user._id);
    } else {
      // Add downvote
      answer.downvotes.push(req.user._id);
      // Remove upvote if exists
      if (alreadyUpvoted) {
        answer.upvotes.pull(req.user._id);
      }
    }

    await answer.save();

    res.json({
      upvotesCount: answer.upvotes.length,
      downvotesCount: answer.downvotes.length,
      voteScore: answer.upvotes.length - answer.downvotes.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ FOLLOW ROUTES ============

// Register follow router
app.use('/api/follow', followRouter);

// FOLLOW/UNFOLLOW USER (legacy route, kept for compatibility)
app.post('/api/follow/:id/follow', authMiddleware, async (req, res) => {
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

// ============ ANSWER ROUTES (from routes file) ============

// Register answers router for /api/answers routes (comments, best, upvote, downvote, etc.)
app.use('/api/answers', answersRouter);

// Register questions/:questionId/answers route (handled by answers router)
app.use('/api/questions', answersRouter);

// ============ BOOKMARK ROUTES ============

// Register bookmark router
app.use('/api', bookmarkRouter);

// ============ START SERVER ============
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
  🚀 Server running on port ${PORT}
  🔗 http://localhost:${PORT}
  🗄️  MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}
  `);
  
  console.log('\n📋 Available Endpoints:');
  console.log('   POST   /api/auth/register      - Register user');
  console.log('   POST   /api/auth/login         - Login user');
  console.log('   GET    /api/auth/me            - Get profile (auth required)');
  console.log('   PUT    /api/auth/update        - Update profile (auth required)');
  console.log('   GET    /api/users              - Get all users');
  console.log('   GET    /api/users/:id          - Get user by ID');
  console.log('   POST   /api/questions          - Create question (auth required)');
  console.log('   GET    /api/questions          - Get all questions (with tag filter)');
  console.log('   GET    /api/tags               - Get all trending tags');
  console.log('   POST   /api/questions/:id/answers - Add answer (auth required)');
  console.log('   POST   /api/follow/:id/follow  - Follow/unfollow (auth required)');
  console.log('   POST   /api/questions/:id/bookmark - Bookmark question (auth required)');
  
  console.log('\n🔍 Discover Page Filters:');
  console.log('   /api/questions?sort=most-viewed      - Most viewed questions');
  console.log('   /api/questions?sort=most-answered    - Most answered questions');
  console.log('   /api/questions?sort=most-voted       - Most upvoted questions');
  console.log('   /api/questions?tag=javascript        - Filter by tag');
  console.log('   /api/questions?category=technology   - Filter by category');
  console.log('   /api/questions?search=react          - Search questions');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});