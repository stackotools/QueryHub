// src/services/answerService.js
import API from '../utils/api';

// Add answer to question
export const addAnswer = async (questionId, content) => {
  try {
    const response = await API.post(`/questions/${questionId}/answers`, { content });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to add answer';
  }
};

// ============ VOTING FUNCTIONS ============

// Upvote answer
export const upvoteAnswer = async (answerId) => {
  try {
    const response = await API.post(`/answers/${answerId}/upvote`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to upvote answer';
  }
};

// Downvote answer
export const downvoteAnswer = async (answerId) => {
  try {
    const response = await API.post(`/answers/${answerId}/downvote`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to downvote answer';
  }
};

// Mark as best answer
export const markBestAnswer = async (answerId) => {
  try {
    const response = await API.post(`/answers/${answerId}/best`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to mark as best answer';
  }
};

// ============ OTHER ANSWER FUNCTIONS ============

// Update an answer
export const updateAnswer = async (answerId, content) => {
  try {
    const response = await API.put(`/answers/${answerId}`, { content });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update answer';
  }
};

// Delete an answer
export const deleteAnswer = async (answerId) => {
  try {
    const response = await API.delete(`/answers/${answerId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to delete answer';
  }
};

// Add comment to answer
export const addCommentToAnswer = async (answerId, comment) => {
  try {
    const response = await API.post(`/answers/${answerId}/comments`, { content: comment });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to add comment';
  }
};

// Get answers by user
export const getAnswersByUser = async (userId) => {
  try {
    const response = await API.get(`/answers/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user answers:', error);
    throw error.response?.data?.message || 'Failed to fetch user answers';
  }
};