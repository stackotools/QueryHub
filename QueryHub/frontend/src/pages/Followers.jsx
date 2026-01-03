// frontend/src/pages/Followers.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaUsers, 
  FaSearch, 
  FaUser,
  FaQuestionCircle,
  FaPen,
  FaUserPlus,
  FaUserCheck
} from 'react-icons/fa';
import { getFollowers, searchUsers } from '../services/followService';
import UserCard from '../components/users/UserCard';
import { useAuth } from '../context/AuthContext';

const Followers = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFollowers, setFilteredFollowers] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchFollowers();
  }, [userId]);

  const fetchFollowers = async () => {
    try {
      setLoading(true);
      const response = await getFollowers(userId);
      setFollowers(response.followers || []);
      setFilteredFollowers(response.followers || []);
      
      // Get user info
      if (response.followers && response.followers.length > 0) {
        setUser(response.followers[0]); // First follower has user info
      }
      
    } catch (error) {
      console.error('Error fetching followers:', error);
      setFollowers([]);
      setFilteredFollowers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFollowers(followers);
    } else {
      const filtered = followers.filter(follower => 
        follower.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        follower.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        follower.bio?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFollowers(filtered);
    }
  }, [searchQuery, followers]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading followers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <FaArrowLeft className="mr-2" />
              Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {user?.name ? `${user.name}'s Followers` : 'Followers'}
            </h1>
            <div className="text-gray-600">{followers.length} followers</div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search followers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{followers.length}</div>
                <div className="text-sm text-gray-600">Total Followers</div>
              </div>
            </div>
            <button
              onClick={fetchFollowers}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Followers Grid */}
        <div>
          {filteredFollowers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFollowers.map(follower => (
                <UserCard 
                  key={follower._id} 
                  user={follower} 
                  showFollowButton={currentUser && currentUser._id !== follower._id}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
              <FaUsers className="text-4xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {searchQuery ? 'No matching followers' : 'No followers yet'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery 
                  ? 'Try adjusting your search' 
                  : 'When someone follows this user, they will appear here.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Followers;