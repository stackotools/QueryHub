import API from '../utils/api';

// Bookmark a question
export const bookmarkQuestion = async (questionId) => {
  try {
    const response = await API.post(`/questions/${questionId}/bookmark`);
    return response.data;
  } catch (error) {
    console.error('Error bookmarking question:', error);
    throw error;
  }
};

// Get bookmark status
export const getBookmarkStatus = async (questionId) => {
  try {
    const response = await API.get(`/questions/${questionId}/bookmark-status`);
    return response.data;
  } catch (error) {
    console.error('Error getting bookmark status:', error);
    throw error;
  }
};

// Get user's bookmarks
export const getUserBookmarks = async (userId) => {
  try {
    const response = await API.get(`/users/${userId}/bookmarks`);
    return response.data;
  } catch (error) {
    console.error('Error getting bookmarks:', error);
    throw error;
  }
};