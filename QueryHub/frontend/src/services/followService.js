import API from '../utils/api';

// Follow/Unfollow a user
export const followUser = async (userId) => {
  try {
    console.log(`Following user ID: ${userId}`);
    const response = await API.post(`/follow/${userId}/follow`);
    console.log('Follow response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error following user:', error);
    throw error;
  }
};

// Check follow status
export const getFollowStatus = async (userId) => {
  try {
    const response = await API.get(`/follow/${userId}/follow-status`);
    return response.data;
  } catch (error) {
    console.error('Error getting follow status:', error);
    return { success: false, isFollowing: false };
  }
};

// Get user's followers
export const getFollowers = async (userId) => {
  try {
    const response = await API.get(`/follow/${userId}/followers`);
    return response.data;
  } catch (error) {
    console.error('Error getting followers:', error);
    return { success: false, followers: [], count: 0 };
  }
};

// Get users being followed
export const getFollowing = async (userId) => {
  try {
    const response = await API.get(`/follow/${userId}/following`);
    return response.data;
  } catch (error) {
    console.error('Error getting following:', error);
    return { success: false, following: [], count: 0 };
  }
};

// Search users
export const searchUsers = async (query) => {
  try {
    const response = await API.get(`/users/search/${query}`);
    return response.data;
  } catch (error) {
    console.error('Error searching users:', error);
    return { success: false, users: [], count: 0 };
  }
};

// Get user profile with follow data
export const getUserProfile = async (userId) => {
  try {
    const response = await API.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};