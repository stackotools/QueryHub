import React, { createContext, useState, useContext, useEffect } from 'react';
import API from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in on page load
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const parsedUser = JSON.parse(userInfo);
        setUser(parsedUser);
        console.log('User loaded from localStorage:', parsedUser.email);
      } catch (err) {
        console.error('Error parsing user info:', err);
        localStorage.removeItem('userInfo');
      }
    }
    setLoading(false);
  }, []);

  // Register function with detailed error handling
  const register = async (userData) => {
    try {
      console.log('📝 Register attempt with data:', { 
        name: userData.name, 
        email: userData.email 
      });
      
      setError(null);
      
      const response = await API.post('/auth/register', userData);
      console.log('✅ Registration successful:', response.data);
      
      localStorage.setItem('userInfo', JSON.stringify(response.data));
      setUser(response.data);
      
      return { 
        success: true, 
        data: response.data,
        message: 'Account created successfully!' 
      };
    } catch (error) {
      console.error('❌ Registration failed:', error);
      
      let errorMessage = 'Registration failed';
      let errorDetails = '';
      
      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
        errorDetails = error.response.data?.details || '';
        console.error('Server error response:', error.response.data);
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'No response from server';
        errorDetails = 'Make sure backend server is running on http://localhost:5000';
        console.error('No response received from server');
      } else {
        // Something else happened
        errorMessage = error.message || 'Network error';
        console.error('Error setting up request:', error.message);
      }
      
      setError(errorMessage);
      
      return { 
        success: false, 
        error: errorMessage,
        details: errorDetails
      };
    }
  };

  // Login function with detailed error handling
  const login = async (email, password) => {
    try {
      console.log('🔑 Login attempt for:', email);
      
      setError(null);
      
      const response = await API.post('/auth/login', { email, password });
      console.log('✅ Login successful:', response.data.email);
      
      localStorage.setItem('userInfo', JSON.stringify(response.data));
      setUser(response.data);
      
      return { 
        success: true, 
        data: response.data,
        message: 'Login successful!' 
      };
    } catch (error) {
      console.error('❌ Login failed:', error);
      
      let errorMessage = 'Login failed';
      
      if (error.response) {
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'No response from server';
      } else {
        errorMessage = error.message || 'Network error';
      }
      
      setError(errorMessage);
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  };

  // Logout function
  const logout = () => {
    console.log('👋 Logging out user:', user?.email);
    localStorage.removeItem('userInfo');
    setUser(null);
    setError(null);
  };

  // Update profile
  const updateProfile = async (userData) => {
    try {
      console.log('📝 Updating profile for:', user?.email);
      
      const response = await API.put('/auth/update', userData);
      console.log('✅ Profile updated successfully');
      
      // Preserve existing token if backend doesn't send one (defensive)
      const updatedUserData = {
        ...response.data,
        token: response.data.token || user?.token
      };
      
      localStorage.setItem('userInfo', JSON.stringify(updatedUserData));
      setUser(updatedUserData);
      
      return { 
        success: true, 
        data: updatedUserData,
        message: 'Profile updated successfully!' 
      };
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      
      let errorMessage = 'Update failed';
      
      if (error.response) {
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      }
      
      setError(errorMessage);
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user && !!user.token;
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    isAuthenticated,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};