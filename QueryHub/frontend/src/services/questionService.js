// src/services/questionService.js
import API from '../utils/api';

// Get all questions
export const getQuestions = async () => {
  try {
    console.log('API: Fetching questions from /questions');
    const response = await API.get('/questions');
    console.log('API Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
};

// Get single question with answers
export const getQuestion = async (id) => {
  try {
    console.log(`API: Fetching question ${id}`);
    const response = await API.get(`/questions/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching question:', error);
    throw error;
  }
};

// Create a new question
export const createQuestion = async (questionData) => {
  try {
    console.log('API: Creating question:', questionData);
    const response = await API.post('/questions', questionData);
    console.log('Question created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating question:', error);
    throw error;
  }
};

// Add answer to question
export const addAnswer = async (questionId, content) => {
  try {
    const response = await API.post(`/questions/${questionId}/answers`, { content });
    return response.data;
  } catch (error) {
    console.error('Error adding answer:', error);
    throw error;
  }
};

// ============ VOTING FUNCTIONS ============

// Upvote a question
export const upvoteQuestion = async (questionId) => {
  try {
    const response = await API.post(`/questions/${questionId}/upvote`);
    return response.data;
  } catch (error) {
    console.error('Error upvoting question:', error);
    throw error;
  }
};

// Downvote a question
export const downvoteQuestion = async (questionId) => {
  try {
    const response = await API.post(`/questions/${questionId}/downvote`);
    return response.data;
  } catch (error) {
    console.error('Error downvoting question:', error);
    throw error;
  }
};

// Update a question
export const updateQuestion = async (questionId, questionData) => {
  try {
    const response = await API.put(`/questions/${questionId}`, questionData);
    return response.data;
  } catch (error) {
    console.error('Error updating question:', error);
    throw error;
  }
};

// Delete a question
export const deleteQuestion = async (questionId) => {
  try {
    const response = await API.delete(`/questions/${questionId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting question:', error);
    throw error;
  }
};

// Get questions by user
export const getQuestionsByUser = async (userId) => {
  try {
    const response = await API.get(`/questions/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user questions:', error);
    throw error;
  }
};

// Get questions by category
export const getQuestionsByCategory = async (category) => {
  try {
    const response = await API.get(`/questions?category=${category}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching category questions:', error);
    throw error;
  }
};

// Search questions
export const searchQuestions = async (query) => {
  try {
    const response = await API.get(`/questions?search=${query}`);
    return response.data;
  } catch (error) {
    console.error('Error searching questions:', error);
    throw error;
  }
};

// Get trending questions
export const getTrendingQuestions = async () => {
  try {
    const response = await API.get('/questions?sort=most-voted');
    return response.data;
  } catch (error) {
    console.error('Error fetching trending questions:', error);
    throw error;
  }
};