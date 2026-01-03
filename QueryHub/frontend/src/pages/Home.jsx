import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaHome, 
  FaQuestionCircle, 
  FaCompass, 
  FaBell, 
  FaUser, 
  FaSearch,
  FaFire,
  FaHashtag,
  FaEdit,
  FaPlus,
  FaFilter,
  FaSortAmountDown,
  FaUsers,
  FaCalendar,
  FaMapMarkerAlt,
  FaSync,
  FaBookmark,
  FaRss,
  FaStar,
  FaTrendingUp,
  FaUserFriends,
  FaChartLine,
  FaBookOpen,
  FaEye,
  FaComment,
  FaThumbsUp
} from 'react-icons/fa';
import QuestionItem from '../components/questions/QuestionItem';
import { getQuestions } from '../services/questionService';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { searchUsers } from '../services/followService';

const Home = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('latest');
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [popularUsers, setPopularUsers] = useState([]);
  const [userStats, setUserStats] = useState({
    questionsAsked: 0,
    answersGiven: 0,
    upvotesReceived: 0,
    followers: 0,
    following: 0,
    bookmarks: 0
  });
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [allQuestions, setAllQuestions] = useState([]); // ✅ सभी questions store करने के लिए

  useEffect(() => {
    if (activeFilter === 'following' && user) {
      fetchFollowingFeed();
    } else {
      fetchQuestions();
    }
    
    if (user) {
      fetchUserStats();
      fetchPopularUsers();
    }
  }, [user, activeFilter]);

  // Refetch questions when search query changes (debounced)
  useEffect(() => {
    if (activeFilter !== 'following') {
      const timer = setTimeout(() => {
        fetchQuestions();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (allQuestions.length > 0) {
      extractTrendingTopics();
    }
  }, [allQuestions]);

  // ✅ UPDATED: REAL DATA FOR QUICK STATS
  const fetchUserStats = async () => {
    try {
      if (!user?._id) return;
      
      // ✅ CHANGE: Use /auth/me endpoint for current user stats
      const response = await API.get(`/auth/me`);
      const userData = response.data;
      
      console.log('User stats from API:', userData);
      
      setUserStats({
        questionsAsked: userData.questionsCount || 0,
        answersGiven: userData.answersCount || 0,
        upvotesReceived: userData.upvotesReceived || 0,
        followers: userData.followersCount || 0,
        following: userData.followingCount || 0,
        bookmarks: userData.bookmarksCount || 0
      });
    } catch (err) {
      console.error('Error fetching user stats:', err);
      // Default values
      setUserStats({
        questionsAsked: 0,
        answersGiven: 0,
        upvotesReceived: 0,
        followers: 0,
        following: 0,
        bookmarks: 0
      });
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      console.log('Fetching questions...');
      
      const response = await getQuestions();
      console.log('Questions response:', response);
      
      let questionsData = [];
      if (response.questions && Array.isArray(response.questions)) {
        questionsData = response.questions;
        setAllQuestions(response.questions); // ✅ सभी questions store करें
      } else if (Array.isArray(response)) {
        questionsData = response;
        setAllQuestions(response);
      }
      
      console.log('Setting questions:', questionsData);
      setQuestions(questionsData);
      setError('');
      
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Failed to load questions. ' + (err.message || ''));
      setQuestions([]);
      setAllQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowingFeed = async () => {
    try {
      setLoading(true);
      const response = await API.get('/follow/feed');
      if (response.data && response.data.success) {
        setQuestions(response.data.questions || []);
        setError('');
      } else {
        setQuestions([]);
        setError('');
      }
    } catch (err) {
      console.error('Error fetching following feed:', err);
      setQuestions([]);
      setError('');
    } finally {
      setLoading(false);
    }
  };

  // ✅ UPDATED: REAL TRENDING TOPICS FROM QUESTIONS
  const extractTrendingTopics = () => {
    try {
      // Extract tags from all questions
      const tags = {};
      
      allQuestions.forEach(q => {
        if (q.tags && Array.isArray(q.tags)) {
          q.tags.forEach(tag => {
            if (tag && typeof tag === 'string') {
              const cleanTag = tag.trim().toLowerCase();
              if (cleanTag) {
                tags[cleanTag] = (tags[cleanTag] || 0) + 1;
              }
            }
          });
        }
      });
      
      // Convert to array and sort by count
      const trending = Object.entries(tags)
        .map(([name, count]) => ({ 
          name: name.charAt(0).toUpperCase() + name.slice(1), 
          count 
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
      
      console.log('Trending topics extracted:', trending);
      setTrendingTopics(trending);
    } catch (err) {
      console.error('Error extracting trends:', err);
      // Fallback topics
      const fallbackTopics = [
        { name: "React", count: 1240 },
        { name: "JavaScript", count: 980 },
        { name: "Web Development", count: 760 },
        { name: "Python", count: 650 },
        { name: "AI & ML", count: 540 },
        { name: "Career Advice", count: 430 },
        { name: "Data Science", count: 390 },
        { name: "Startups", count: 320 }
      ];
      setTrendingTopics(fallbackTopics);
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
    } catch (err) {
      console.error('Error fetching popular users:', err);
    }
  };

  const handleUserSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setUserSearchLoading(true);
      const response = await searchUsers(searchQuery);
      setUserSearchResults(response.users || []);
      setShowUserSearch(true);
    } catch (err) {
      console.error('Error searching users:', err);
      setUserSearchResults([]);
    } finally {
      setUserSearchLoading(false);
    }
  };

  // No need for client-side filtering since backend handles search now
  const filteredQuestions = questions;

  const sortQuestions = (questionsToSort) => {
    switch (activeFilter) {
      case 'latest':
        return [...questionsToSort].sort((a, b) => 
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
      case 'trending':
        return [...questionsToSort].sort((a, b) => 
          (b.upvotes?.length || 0) - (a.upvotes?.length || 0)
        );
      case 'most-answers':
        return [...questionsToSort].sort((a, b) => 
          (b.answersCount || 0) - (a.answersCount || 0)
        );
      case 'most-views':
        return [...questionsToSort].sort((a, b) => 
          (b.views || 0) - (a.views || 0)
        );
      case 'following':
        // Questions from followed users are already filtered by API
        return questionsToSort;
      default:
        return questionsToSort;
    }
  };

  const sortedQuestions = sortQuestions(filteredQuestions);

  const refreshAllData = () => {
    fetchQuestions();
    if (user) {
      fetchUserStats();
      fetchPopularUsers();
    }
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (searchQuery.startsWith('@')) {
      // User search
      handleUserSearch();
    } else {
      // Question search - fetch from backend
      setShowUserSearch(false);
      if (searchQuery.trim()) {
        try {
          setLoading(true);
          const response = await API.get(`/questions?search=${encodeURIComponent(searchQuery)}`);
          const questionsData = response.data.questions || response.data || [];
          setQuestions(questionsData);
        } catch (err) {
          console.error('Error searching questions:', err);
          setError('Failed to search questions');
        } finally {
          setLoading(false);
        }
      } else {
        // Empty search - fetch all questions
        fetchQuestions();
      }
    }
  };

  // ✅ NEW: Handle tag click - Navigate to Discover page with tag filter
  const handleTagClick = (tagName) => {
    const lowercaseTag = tagName.toLowerCase();
    // Navigate to Discover page with tag parameter
    window.location.href = `/discover?tag=${lowercaseTag}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <FaQuestionCircle className="text-2xl text-blue-600" />
              <span className="text-xl font-bold text-gray-900">QueryHub</span>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8">
              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search questions, @users, or #tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={refreshAllData}
                className="p-2 text-gray-600 hover:text-blue-600"
                title="Refresh"
              >
                <FaSync className="text-lg" />
              </button>
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <FaBell className="text-xl" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <Link to="/ask" className="hidden md:flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <FaPlus className="mr-2" />
                Ask Question
              </Link>
              <Link to="/profile" className="flex items-center space-x-2">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="w-8 h-8 rounded-full border"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <span className="hidden md:inline font-medium">{user?.name?.split(' ')[0] || 'User'}</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar */}
          <div className="lg:w-1/5">
            <div className="bg-white rounded-xl shadow-sm border p-4 sticky top-24">
              <nav className="space-y-2">
                <Link to="/home" className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 text-blue-600">
                  <FaHome />
                  <span className="font-medium">Home</span>
                </Link>
                <Link to="/discover" className="flex items-center space-x-3 p-3 rounded-lg text-gray-700 hover:bg-gray-100">
                  <FaFire />
                  <span className="font-medium">Discover</span>
                </Link>
                <Link to="/users" className="flex items-center space-x-3 p-3 rounded-lg text-gray-700 hover:bg-gray-100">
                  <FaUsers />
                  <span className="font-medium">Explore Users</span>
                </Link>
                <Link to="/profile" className="flex items-center space-x-3 p-3 rounded-lg text-gray-700 hover:bg-gray-100">
                  <FaUser />
                  <span className="font-medium">Profile</span>
                </Link>
                <Link to="/bookmarks" className="flex items-center space-x-3 p-3 rounded-lg text-gray-700 hover:bg-gray-100">
                  <FaBookmark />
                  <span className="font-medium">Bookmarks</span>
                </Link>
                <Link to="/my-questions" className="flex items-center space-x-3 p-3 rounded-lg text-gray-700 hover:bg-gray-100">
                  <FaQuestionCircle />
                  <span className="font-medium">My Questions</span>
                </Link>
                
              </nav>

              {/* ✅ UPDATED: Quick Stats with REAL DATA */}
              <div className="mt-8 pt-8 border-t">
                <h3 className="font-semibold text-gray-900 mb-4">Your Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Questions</span>
                    <span className="font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded text-sm">
                      {userStats.questionsAsked}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Answers</span>
                    <span className="font-semibold bg-green-100 text-green-600 px-2 py-1 rounded text-sm">
                      {userStats.answersGiven}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Upvotes</span>
                    <span className="font-semibold bg-yellow-100 text-yellow-600 px-2 py-1 rounded text-sm">
                      {userStats.upvotesReceived}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Bookmarks</span>
                    <span className="font-semibold bg-orange-100 text-orange-600 px-2 py-1 rounded text-sm">
                      {userStats.bookmarks}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Link 
                    to="/ask"
                    className="block w-full text-center py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                  >
                    <FaEdit className="inline mr-2" />
                    Ask Question
                  </Link>
                  <Link 
                    to="/users"
                    className="block w-full text-center py-2 border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition"
                  >
                    <FaUsers className="inline mr-2" />
                    Find Users
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/5">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold mb-2">
                    {user ? `Welcome back, ${user.name || 'User'}! 👋` : 'Welcome to QueryHub! 👋'}
                  </h1>
                  <p className="opacity-90">
                    {user?.bio || 'What would you like to learn or share today?'}
                  </p>
                  {user?.location && (
                    <div className="flex items-center mt-2 opacity-80">
                      <FaMapMarkerAlt className="mr-2" />
                      <span>{user.location}</span>
                    </div>
                  )}
                </div>
                <Link 
                  to="/ask" 
                  className="flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100"
                >
                  <FaEdit className="mr-2" />
                  Ask Question
                </Link>
              </div>
              
              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{userStats.questionsAsked}</div>
                  <div className="text-sm opacity-80">Questions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{userStats.answersGiven}</div>
                  <div className="text-sm opacity-80">Answers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{userStats.followers}</div>
                  <div className="text-sm opacity-80">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{userStats.following}</div>
                  <div className="text-sm opacity-80">Following</div>
                </div>
              </div>
            </div>

            {/* User Search Results */}
            {showUserSearch && userSearchResults.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    Users found for "{searchQuery}"
                  </h2>
                  <button 
                    onClick={() => setShowUserSearch(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Show Questions
                  </button>
                </div>
                
                <div className="space-y-4">
                  {userSearchResults.map(user => (
                    <div key={user._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <Link to={`/profile/${user._id}`}>
                          {user.avatar ? (
                            <img 
                              src={user.avatar} 
                              alt={user.name}
                              className="w-12 h-12 rounded-full border"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                              {user.name?.charAt(0) || 'U'}
                            </div>
                          )}
                        </Link>
                        <div>
                          <Link to={`/profile/${user._id}`} className="font-semibold text-gray-900 hover:text-blue-600">
                            {user.name}
                          </Link>
                          <p className="text-gray-500 text-sm">@{user.username}</p>
                          {user.bio && (
                            <p className="text-gray-600 text-sm mt-1 line-clamp-1">{user.bio}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="font-bold">{user.questionsCount || 0}</div>
                          <div className="text-xs text-gray-500">Questions</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold">{user.followers?.length || 0}</div>
                          <div className="text-xs text-gray-500">Followers</div>
                        </div>
                        <Link 
                          to={`/profile/${user._id}`}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          View Profile
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filter Bar */}
            <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
              <div className="flex flex-wrap justify-between items-center">
                <div className="flex space-x-2 mb-4 md:mb-0">
                  <button 
                    onClick={() => setActiveFilter('latest')}
                    className={`px-4 py-2 rounded-lg font-medium ${activeFilter === 'latest' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    Latest
                  </button>
                  <button 
                    onClick={() => setActiveFilter('trending')}
                    className={`px-4 py-2 rounded-lg font-medium ${activeFilter === 'trending' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <FaFire className="inline mr-2" />
                    Trending
                  </button>
                  <button 
                    onClick={() => setActiveFilter('most-answers')}
                    className={`px-4 py-2 rounded-lg font-medium ${activeFilter === 'most-answers' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    Most Answers
                  </button>
                  <button 
                    onClick={() => setActiveFilter('most-views')}
                    className={`px-4 py-2 rounded-lg font-medium ${activeFilter === 'most-views' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    Most Views
                  </button>
                  {user && (
                    <button 
                      onClick={() => setActiveFilter('following')}
                      className={`px-4 py-2 rounded-lg font-medium ${activeFilter === 'following' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      <FaUserFriends className="inline mr-2" />
                      Following
                    </button>
                  )}
                </div>
                <div className="flex items-center text-gray-600">
                  <FaSortAmountDown className="mr-2" />
                  <span>Sort by: {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}</span>
                </div>
              </div>
            </div>

            {/* Questions Feed */}
            <div>
              {/* Refresh Button */}
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {activeFilter === 'following' ? 'Questions from Users You Follow' : 'Recent Questions'}
                </h2>
                <button 
                  onClick={() => {
                    if (activeFilter === 'following' && user) {
                      fetchFollowingFeed();
                    } else {
                      fetchQuestions();
                    }
                  }}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <FaSync className="mr-2" />
                  Refresh Questions
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading questions...</p>
                </div>
              ) : error ? (
                <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                  <FaSearch className="text-4xl text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Failed to load questions</h3>
                  <p className="text-gray-500 mb-4">{error}</p>
                  <button 
                    onClick={fetchQuestions}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Try Again
                  </button>
                </div>
              ) : sortedQuestions.length > 0 ? (
                <div className="space-y-4">
                  {sortedQuestions.map(question => (
                    <QuestionItem 
                      key={question._id || question.id} 
                      question={question} 
                      refreshQuestions={fetchQuestions} 
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                  {activeFilter === 'following' ? (
                    <>
                      <FaUserFriends className="text-4xl text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">No questions from followed users</h3>
                      <p className="text-gray-500 mb-4">Follow some users to see their questions here!</p>
                      <Link to="/users" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Explore Users
                      </Link>
                    </>
                  ) : (
                    <>
                      <FaQuestionCircle className="text-4xl text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">No questions found</h3>
                      <p className="text-gray-500 mb-4">
                        {searchQuery ? 'Try adjusting your search' : 'Be the first to ask a question!'}
                      </p>
                      <Link to="/ask" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Ask a Question
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>



          {/* Right Sidebar */}
          <div className="lg:w-1/5">
            {/* ✅ UPDATED: Trending Topics - REAL TAGS AND CLICKABLE */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-lg">🔥 Trending Topics</h3>
                <FaFire className="text-orange-500" />
              </div>
              <div className="space-y-3">
                {trendingTopics.length > 0 ? (
                  trendingTopics.map((topic, index) => (
                    <button
                      key={index}
                      onClick={() => handleTagClick(topic.name)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 group text-left"
                    >
                      <div className="flex items-center">
                        <FaHashtag className="text-gray-400 mr-3" />
                        <span className="font-medium text-gray-800 group-hover:text-blue-600">
                          {topic.name}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {topic.count}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">Loading trending topics...</p>
                )}
              </div>
              <Link 
                to="/discover"
                className="block mt-4 text-center text-blue-600 font-medium hover:text-blue-800"
              >
                View all topics →
              </Link>
            </div>

            {/* Popular Users */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-lg">👥 Popular Users</h3>
                <FaStar className="text-yellow-500" />
              </div>
              <div className="space-y-4">
                {popularUsers.length > 0 ? (
                  popularUsers.map((user, index) => (
                    <div key={user._id} className="flex items-center p-3 hover:bg-gray-50 rounded-lg group">
                      <div className="text-gray-400 font-bold mr-3">{index + 1}</div>
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name}
                          className="w-10 h-10 rounded-full mr-3"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold mr-3">
                          {user.name?.charAt(0) || 'U'}
                        </div>
                      )}
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
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No popular users yet</p>
                )}
              </div>
              <Link 
                to="/users"
                className="block mt-4 text-center text-blue-600 font-medium hover:text-blue-800"
              >
                Explore more users →
              </Link>
            </div>

            {/* Community Stats */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
              <h3 className="font-bold text-gray-900 text-lg mb-4">📊 Community Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FaQuestionCircle className="text-blue-500 mr-3" />
                    <span className="text-gray-700">Total Questions</span>
                  </div>
                  <span className="font-bold">{questions.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FaComment className="text-green-500 mr-3" />
                    <span className="text-gray-700">Total Answers</span>
                  </div>
                  <span className="font-bold">{questions.reduce((sum, q) => sum + (q.answersCount || 0), 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FaThumbsUp className="text-yellow-500 mr-3" />
                    <span className="text-gray-700">Total Upvotes</span>
                  </div>
                  <span className="font-bold">{questions.reduce((sum, q) => sum + (q.upvotes?.length || 0), 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FaEye className="text-purple-500 mr-3" />
                    <span className="text-gray-700">Total Views</span>
                  </div>
                  <span className="font-bold">{questions.reduce((sum, q) => sum + (q.views || 0), 0)}</span>
                </div>
              </div>
            </div>

            {/* Ask Question Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
              <FaQuestionCircle className="text-3xl text-blue-600 mb-4" />
              <h4 className="font-bold text-gray-900 mb-2">Can't find an answer?</h4>
              <p className="text-gray-600 text-sm mb-4">
                Ask your question to the QueryHub community of experts and enthusiasts.
              </p>
              <Link 
                to="/ask"
                className="block w-full text-center py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Ask a Question
              </Link>
            </div>

            {/* Footer Links */}
            <div className="mt-6 text-xs text-gray-500 space-y-2">
              <div className="flex flex-wrap gap-3">
                <Link to="/about" className="hover:text-gray-700">About</Link>
                <Link to="/careers" className="hover:text-gray-700">Careers</Link>
                <Link to="/blog" className="hover:text-gray-700">Blog</Link>
                <Link to="/privacy" className="hover:text-gray-700">Privacy</Link>
                <Link to="/terms" className="hover:text-gray-700">Terms</Link>
                <Link to="/help" className="hover:text-gray-700">Help</Link>
              </div>
              <p>© 2024 QueryHub. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;