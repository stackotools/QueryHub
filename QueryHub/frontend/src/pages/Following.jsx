// frontend/src/pages/Following.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaUserFriends, 
  FaSearch, 
  FaUser,
  FaQuestionCircle,
  FaPen
} from 'react-icons/fa';
import { getFollowing } from '../services/followService';
import UserCard from '../components/users/UserCard';
import { useAuth } from '../context/AuthContext';

const Following = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFollowing, setFilteredFollowing] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchFollowing();
  }, [userId]);

  const fetchFollowing = async () => {
    try {
      setLoading(true);
      const response = await getFollowing(userId);
      setFollowing(response.following || []);
      setFilteredFollowing(response.following || []);
      
    } catch (error) {
      console.error('Error fetching following:', error);
      setFollowing([]);
      setFilteredFollowing([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFollowing(following);
    } else {
      const filtered = following.filter(followed => 
        followed.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        followed.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        followed.bio?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFollowing(filtered);
    }
  }, [searchQuery, following]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading following...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Following</h1>
            <div className="text-gray-600">{following.length} following</div>
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
              placeholder="Search following..."
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
                <div className="text-3xl font-bold text-gray-900">{following.length}</div>
                <div className="text-sm text-gray-600">Total Following</div>
              </div>
            </div>
            <button
              onClick={fetchFollowing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Following Grid */}
        <div>
          {filteredFollowing.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFollowing.map(followed => (
                <UserCard 
                  key={followed._id} 
                  user={followed} 
                  showFollowButton={currentUser && currentUser._id !== followed._id}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
              <FaUserFriends className="text-4xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {searchQuery ? 'No matching users' : 'Not following anyone yet'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery 
                  ? 'Try adjusting your search' 
                  : 'Start following users to see them here.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Following;