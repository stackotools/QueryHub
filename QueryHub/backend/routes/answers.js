const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Answer = require('../models/Answer');
const Question = require('../models/Question');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   POST /api/questions/:questionId/answers
// @desc    Add an answer to a question
// @access  Private
router.post('/:questionId/answers', protect, async (req, res) => {
  try {
    const { content } = req.body;

    // Basic validation to prevent cast errors and empty content
    if (!mongoose.Types.ObjectId.isValid(req.params.questionId)) {
      return res.status(400).json({ message: 'Invalid question ID' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Content is required' });
    }
    const question = await Question.findById(req.params.questionId);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const answer = await Answer.create({
      content,
      question: question._id,
      author: req.user._id
    });

    // Increment question's answers count
    question.answersCount += 1;
    await question.save();

    // Increment user's answers count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { answersCount: 1 }
    });

    const populatedAnswer = await Answer.findById(answer._id)
      .populate('author', 'name username avatar bio');

    res.status(201).json(populatedAnswer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/answers/:id
// @desc    Update an answer
// @access  Private (Answer owner only)
router.put('/:id', protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid answer ID' });
    }

    let answer = await Answer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    // Check if user is the author
    if (answer.author.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    answer = await Answer.findByIdAndUpdate(
      req.params.id,
      { content: req.body.content },
      { new: true, runValidators: true }
    ).populate('author', 'name username avatar bio');

    res.json(answer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/answers/:id
// @desc    Delete an answer
// @access  Private (Answer owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid answer ID' });
    }
    const answer = await Answer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    // Check if user is the author
    if (answer.author.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Decrement question's answers count
    await Question.findByIdAndUpdate(answer.question, {
      $inc: { answersCount: -1 }
    });

    // Decrement user's answers count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { answersCount: -1 }
    });

    await answer.deleteOne();

    res.json({ message: 'Answer removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/answers/:id/upvote
// @desc    Upvote an answer
// @access  Private
router.post('/:id/upvote', protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid answer ID' });
    }
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
router.post('/:id/downvote', protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid answer ID' });
    }
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

// @route   POST /api/answers/:id/best
// @desc    Toggle best answer (allow multiple best answers)
// @access  Private (Question owner only)
router.post('/:id/best', protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid answer ID' });
    }
    const answer = await Answer.findById(req.params.id).populate('question');

    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    const question = await Question.findById(answer.question._id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check if user is the question author
    if (question.author.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized. Only question owner can mark best answer.' });
    }

    // Toggle best answer status (allow multiple best answers)
    answer.isBestAnswer = !answer.isBestAnswer;
    await answer.save();

    // Update question isAnswered flag if at least one best answer exists
    const bestAnswersCount = await Answer.countDocuments({ 
      question: question._id, 
      isBestAnswer: true 
    });
    question.isAnswered = bestAnswersCount > 0;
    await question.save();

    const populatedAnswer = await Answer.findById(answer._id)
      .populate('author', 'name username avatar bio')
      .populate({
        path: 'comments.author',
        select: 'name username avatar'
      });

    res.json(populatedAnswer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/answers/:id/comments
// @desc    Add comment to answer
// @access  Private
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid answer ID' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Content is required' });
    }
    const answer = await Answer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    answer.comments.push({
      content,
      author: req.user._id
    });

    await answer.save();

    // Get the last comment with author details
    const lastComment = answer.comments[answer.comments.length - 1];
    const populatedComment = await Answer.populate(lastComment, {
      path: 'author',
      select: 'name username avatar'
    });

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;