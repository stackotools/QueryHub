// frontend/src/pages/ExploreUsers.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaSearch, 
  FaUsers, 
  FaFire,
  FaFilter,
  FaUserPlus,
  FaStar
} from 'react-icons/fa';
import { searchUsers } from '../services/followService';
import UserCard from '../components/users/UserCard';
import API from '../utils/api';

const ExploreUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [popularUsers, setPopularUsers] = useState([]);

  useEffect(() => {
    fetchAllUsers();
    fetchPopularUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      // Fetch all users directly from /users endpoint
      const response = await API.get('/users');
      const usersList = response.data.users || response.data || [];
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularUsers = async () => {
    try {
      const response = await API.get('/users');
      // Handle response structure: response.data.users or response.data
      const users = response.data.users || response.data || [];
      // Sort by followers count (descending)
      const sorted = users.sort((a, b) => 
        (b.followersCount || b.followers?.length || 0) - (a.followersCount || a.followers?.length || 0)
      ).slice(0, 5);
      setPopularUsers(sorted);
    } catch (error) {
      console.error('Error fetching popular users:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      try {
        setLoading(true);
        const response = await searchUsers(searchQuery);
        setUsers(response.users || []);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredUsers = users.filter(user => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'most-followed') {
      return (user.followers?.length || 0) > 100;
    }
    if (activeFilter === 'most-questions') {
      return (user.questionsCount || 0) > 10;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Explore Users</h1>
            <div className="text-gray-600">{users.length} users</div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search users by name, username, or bio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="lg:w-3/4">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setActiveFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium ${activeFilter === 'all' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  All Users
                </button>
                <button 
                  onClick={() => setActiveFilter('most-followed')}
                  className={`px-4 py-2 rounded-lg font-medium ${activeFilter === 'most-followed' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <FaUsers className="inline mr-2" />
                  Most Followed
                </button>
                <button 
                  onClick={() => setActiveFilter('most-questions')}
                  className={`px-4 py-2 rounded-lg font-medium ${activeFilter === 'most-questions' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <FaFire className="inline mr-2" />
                  Top Contributors
                </button>
              </div>
            </div>

            {/* Users Grid */}
            <div className="space-y-6">
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <UserCard 
                    key={user._id} 
                    user={user} 
                    showFollowButton={true}
                    size="medium"
                  />
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
                  <FaUsers className="text-4xl text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    {searchQuery ? 'No users found' : 'No users available'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery 
                      ? 'Try a different search term' 
                      : 'Check back later for more users.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/4">
            {/* Popular Users */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">🔥 Popular Users</h3>
                <FaStar className="text-yellow-500" />
              </div>
              <div className="space-y-4">
                {popularUsers.map((user, index) => (
                  <div key={user._id} className="flex items-center p-3 hover:bg-gray-50 rounded-lg group">
                    <div className="text-gray-400 font-bold mr-3">{index + 1}</div>
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-10 h-10 rounded-full mr-3"
                    />
                    <div className="flex-1">
                      <Link 
                        to={`/profile/${user._id}`}
                        className="font-medium text-gray-900 group-hover:text-blue-600 text-sm block"
                      >
                        {user.name}
                      </Link>
                      <div className="flex items-center text-xs text-gray-500">
                        <FaUsers className="mr-1" />
                        <span>{user.followers?.length || 0} followers</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Link 
                to="/users/trending"
                className="block mt-4 text-center text-blue-600 font-medium hover:text-blue-800 text-sm"
              >
                View more trending users →
              </Link>
            </div>

            {/* Stats */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 text-lg mb-3">💡 Find Experts</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">✓</div>
                  <span>Follow experts in your field</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">✓</div>
                  <span>Get notified about their answers</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">✓</div>
                  <span>Build your professional network</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">✓</div>
                  <span>Discover new content and insights</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExploreUsers;