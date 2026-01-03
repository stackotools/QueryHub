import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaUser, 
  FaEdit, 
  FaQuestionCircle, 
  FaPen, 
  FaThumbsUp, 
  FaUsers, 
  FaUserFriends,
  FaUserPlus,
  FaCalendar,
  FaMapMarkerAlt,
  FaLink,
  FaTwitter,
  FaGithub,
  FaLinkedin,
  FaBookmark,
  FaHistory,
  FaCamera,
  FaCheck,
  FaArrowLeft,
  FaTrash,
  FaSave,
  FaTimes,
  FaRegBookmark,
  FaEye,
  FaComment,
  FaHashtag
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { getUserBookmarks } from '../services/bookmarkService';

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('questions');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    name: '',
    bio: '',
    location: '',
    website: '',
    twitter: '',
    github: '',
    linkedin: '',
    avatar: ''
  });
  const [userQuestions, setUserQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [userBookmarks, setUserBookmarks] = useState([]);
  const [userStats, setUserStats] = useState({
    questionsAsked: 0,
    answersGiven: 0,
    upvotesReceived: 0,
    followers: 0,
    following: 0,
    bookmarks: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [followersList, setFollowersList] = useState([]);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [loadingFollowers, setLoadingFollowers] = useState(false);

  useEffect(() => {
    if (user?._id) {
      fetchUserData();
      setProfileData({
        name: user.name || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        twitter: user.twitter || '',
        github: user.github || '',
        linkedin: user.linkedin || '',
        avatar: user.avatar || ''
      });
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile
      const response = await API.get(`/auth/me`);
      const userData = response.data;
      
      // Set user data
      setUserStats({
        questionsAsked: userData.questionsCount || 0,
        answersGiven: userData.answersCount || 0,
        upvotesReceived: userData.upvotesReceived || 0,
        followers: userData.followersCount || 0,
        following: userData.followingCount || 0,
        bookmarks: userData.bookmarksCount || 0
      });
      
      // Fetch user questions
      const questionsResponse = await API.get(`/questions/user/${user._id}`);
      const questionsData = Array.isArray(questionsResponse.data) ? questionsResponse.data : (questionsResponse.data?.questions || []);
      setUserQuestions(questionsData);
      
      // Fetch user answers
      const answersResponse = await API.get(`/users/${user._id}/answers`);
      const answersData = Array.isArray(answersResponse.data) ? answersResponse.data : (answersResponse.data?.answers || []);
      setUserAnswers(answersData);
      
      // Fetch bookmarks
      const bookmarksResponse = await getUserBookmarks(user._id);
      if (bookmarksResponse.success) {
        setUserBookmarks(bookmarksResponse.bookmarks || []);
      }
      
      // Generate recent activity
      generateRecentActivity(questionsResponse.data || [], answersResponse.data || []);
      
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarks = async () => {
    try {
      const response = await getUserBookmarks(user._id);
      if (response.success) {
        setUserBookmarks(response.bookmarks || []);
        setUserStats(prev => ({
          ...prev,
          bookmarks: response.count || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    }
  };

  const generateRecentActivity = (questions, answers) => {
    const activities = [];
    
    // Add questions as activities
    questions.slice(0, 3).forEach(q => {
      activities.push({
        type: 'asked',
        content: q.title,
        timestamp: q.createdAt,
        icon: FaQuestionCircle,
        link: `/question/${q._id}`
      });
    });
    
    // Add answers as activities
    answers.slice(0, 3).forEach(a => {
      activities.push({
        type: 'answered',
        content: a.question?.title || 'a question',
        timestamp: a.createdAt,
        icon: FaPen,
        link: `/question/${a.question?._id}`
      });
    });
    
    // Sort by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setRecentActivity(activities.slice(0, 5));
  };

  const handleSaveProfile = async () => {
    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        setIsEditing(false);
        await fetchUserData();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setProfileData({
      name: user.name || '',
      bio: user.bio || '',
      location: user.location || '',
      website: user.website || '',
      twitter: user.twitter || '',
      github: user.github || '',
      linkedin: user.linkedin || '',
      avatar: user.avatar || ''
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(dateString);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'bookmarks') {
      fetchBookmarks();
    } else if (tab === 'following') {
      fetchFollowing();
    } else if (tab === 'followers') {
      fetchFollowers();
    }
  };

  const fetchFollowing = async () => {
    try {
      setLoadingFollowing(true);
      const response = await API.get(`/follow/${user._id}/following`);
      if (response.data && response.data.following) {
        setFollowingList(response.data.following);
      } else {
        setFollowingList([]);
      }
    } catch (error) {
      console.error('Error fetching following:', error);
      setFollowingList([]);
    } finally {
      setLoadingFollowing(false);
    }
  };

  const fetchFollowers = async () => {
    try {
      setLoadingFollowers(true);
      const response = await API.get(`/follow/${user._id}/followers`);
      if (response.data && response.data.followers) {
        setFollowersList(response.data.followers);
      } else {
        setFollowersList([]);
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
      setFollowersList([]);
    } finally {
      setLoadingFollowers(false);
    }
  };

  const handleFollowUser = async (userId) => {
    try {
      const response = await API.post(`/follow/${userId}/follow`);
      if (response.data.success) {
        // Refresh followers list
        fetchFollowers();
        // Update user stats
        const userRes = await API.get(`/auth/me`);
        setUserStats(prev => ({
          ...prev,
          followers: userRes.data.followersCount || prev.followers,
          following: userRes.data.followingCount || prev.following
        }));
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please login to view profile</h2>
          <Link to="/login" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Go to Login
          </Link>
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
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-red-600 hover:text-red-800 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Profile Info */}
          <div className="lg:w-1/3">
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative mb-4">
                  {isEditing ? (
                    <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                      <input
                        type="text"
                        value={profileData.avatar}
                        onChange={(e) => setProfileData({...profileData, avatar: e.target.value})}
                        placeholder="Avatar URL"
                        className="w-full p-2 text-center border rounded"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  {isEditing && (
                    <button className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100">
                      <FaCamera className="text-gray-600" />
                    </button>
                  )}
                </div>
                
                {isEditing ? (
                  <div className="w-full space-y-4">
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Full Name"
                    />
                    <input
                      type="text"
                      value={user.email}
                      disabled
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                      placeholder="Email"
                    />
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                    <p className="text-gray-500">@{user.username || user.email?.split('@')[0]}</p>
                    <p className="text-gray-600 mt-2">{user.email}</p>
                  </>
                )}
              </div>

              {/* Bio */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Bio</h3>
                {isEditing ? (
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="4"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="text-gray-600">{user.bio || 'No bio yet'}</p>
                )}
              </div>

              {/* Location & Join Date */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-gray-600">
                  <FaMapMarkerAlt className="mr-3" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.location}
                      onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                      className="flex-1 p-2 border border-gray-300 rounded"
                      placeholder="Location"
                    />
                  ) : (
                    <span>{user.location || 'Not specified'}</span>
                  )}
                </div>
                <div className="flex items-center text-gray-600">
                  <FaCalendar className="mr-3" />
                  <span>Joined {formatDate(user.createdAt)}</span>
                </div>
              </div>

              {/* Social Links */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Social Links</h3>
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <FaLink className="mr-3 text-gray-400" />
                      <input
                        type="text"
                        value={profileData.website}
                        onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                        className="flex-1 p-2 border border-gray-300 rounded"
                        placeholder="Website"
                      />
                    </div>
                    <div className="flex items-center">
                      <FaTwitter className="mr-3 text-blue-400" />
                      <input
                        type="text"
                        value={profileData.twitter}
                        onChange={(e) => setProfileData({...profileData, twitter: e.target.value})}
                        className="flex-1 p-2 border border-gray-300 rounded"
                        placeholder="Twitter"
                      />
                    </div>
                    <div className="flex items-center">
                      <FaGithub className="mr-3 text-gray-700" />
                      <input
                        type="text"
                        value={profileData.github}
                        onChange={(e) => setProfileData({...profileData, github: e.target.value})}
                        className="flex-1 p-2 border border-gray-300 rounded"
                        placeholder="GitHub"
                      />
                    </div>
                    <div className="flex items-center">
                      <FaLinkedin className="mr-3 text-blue-600" />
                      <input
                        type="text"
                        value={profileData.linkedin}
                        onChange={(e) => setProfileData({...profileData, linkedin: e.target.value})}
                        className="flex-1 p-2 border border-gray-300 rounded"
                        placeholder="LinkedIn"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex space-x-4">
                    {user.website && (
                      <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-600" title="Website">
                        <FaLink size={20} />
                      </a>
                    )}
                    {user.twitter && (
                      <a href={user.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-500" title="Twitter">
                        <FaTwitter size={20} />
                      </a>
                    )}
                    {user.github && (
                      <a href={user.github} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-gray-900" title="GitHub">
                        <FaGithub size={20} />
                      </a>
                    )}
                    {user.linkedin && (
                      <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700" title="LinkedIn">
                        <FaLinkedin size={20} />
                      </a>
                    )}
                    {!user.website && !user.twitter && !user.github && !user.linkedin && (
                      <p className="text-gray-500 text-sm">No social links added</p>
                    )}
                  </div>
                )}
              </div>

              {/* Edit/Save Buttons */}
              <div className="pt-4 border-t">
                {isEditing ? (
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSaveProfile}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                    >
                      <FaSave className="mr-2" />
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                    >
                      <FaTimes className="mr-2" />
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                  >
                    <FaEdit className="mr-2" />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-bold text-gray-900 text-lg mb-4">Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <FaQuestionCircle className="text-blue-600 text-xl" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{userStats.questionsAsked}</div>
                  <div className="text-sm text-gray-600">Questions</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <FaPen className="text-green-600 text-xl" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{userStats.answersGiven}</div>
                  <div className="text-sm text-gray-600">Answers</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <FaThumbsUp className="text-yellow-600 text-xl" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{userStats.upvotesReceived}</div>
                  <div className="text-sm text-gray-600">Upvotes</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <FaUsers className="text-purple-600 text-xl" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{userStats.followers}</div>
                  <div className="text-sm text-gray-600">Followers</div>
                </div>
                <div className="text-center p-4 bg-pink-50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <FaUserFriends className="text-pink-600 text-xl" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{userStats.following}</div>
                  <div className="text-sm text-gray-600">Following</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <FaBookmark className="text-orange-600 text-xl" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{userStats.bookmarks}</div>
                  <div className="text-sm text-gray-600">Bookmarks</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-2/3">
            {/* Tabs - WITH FOLLOWERS TAB ADDED */}
            <div className="bg-white rounded-xl shadow-sm border mb-6">
              <div className="flex border-b overflow-x-auto">
                <button
                  onClick={() => handleTabChange('questions')}
                  className={`flex-1 py-4 px-6 text-center font-medium whitespace-nowrap ${activeTab === 'questions' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <FaQuestionCircle className="inline mr-2" />
                  Questions ({userQuestions.length})
                </button>
                <button
                  onClick={() => handleTabChange('answers')}
                  className={`flex-1 py-4 px-6 text-center font-medium whitespace-nowrap ${activeTab === 'answers' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <FaPen className="inline mr-2" />
                  Answers ({userAnswers.length})
                </button>
                <button
                  onClick={() => handleTabChange('bookmarks')}
                  className={`flex-1 py-4 px-6 text-center font-medium whitespace-nowrap ${activeTab === 'bookmarks' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <FaBookmark className="inline mr-2" />
                  Bookmarks ({userBookmarks.length})
                </button>
                {/* FOLLOWERS TAB - NEW */}
                <button
                  onClick={() => handleTabChange('followers')}
                  className={`flex-1 py-4 px-6 text-center font-medium whitespace-nowrap ${activeTab === 'followers' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <FaUsers className="inline mr-2" />
                  Followers ({userStats.followers})
                </button>
                {/* FOLLOWING TAB */}
                <button
                  onClick={() => handleTabChange('following')}
                  className={`flex-1 py-4 px-6 text-center font-medium whitespace-nowrap ${activeTab === 'following' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <FaUserFriends className="inline mr-2" />
                  Following ({userStats.following})
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'questions' && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Questions Asked</h3>
                    {userQuestions.length > 0 ? (
                      userQuestions.map(question => (
                        <div key={question._id} className="border-b border-gray-200 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
                          <Link to={`/question/${question._id}`} className="text-lg font-semibold text-gray-900 hover:text-blue-600 mb-2 block">
                            {question.title}
                          </Link>
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                            {question.content}
                          </p>
                          <div className="flex items-center text-sm text-gray-500">
                            <span className="mr-4">
                              <FaComment className="inline mr-1" />
                              {question.answersCount || 0} answers
                            </span>
                            <span>
                              <FaThumbsUp className="inline mr-1" />
                              {(question.upvotes?.length || 0) - (question.downvotes?.length || 0)} votes
                            </span>
                            <span>
                              <FaEye className="inline mx-1" />
                              {question.views || 0} views
                            </span>
                            <span className="ml-auto">{formatTimeAgo(question.createdAt)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <FaQuestionCircle className="text-4xl text-gray-300 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-gray-700 mb-2">No questions yet</h4>
                        <p className="text-gray-500 mb-4">Ask your first question to get started!</p>
                        <Link to="/ask" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          Ask a Question
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'answers' && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Answers Given</h3>
                    {userAnswers.length > 0 ? (
                      userAnswers.map(answer => (
                        <div key={answer._id} className="border-b border-gray-200 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
                          <Link to={`/question/${answer.question?._id}`} className="text-lg font-semibold text-gray-900 hover:text-blue-600 mb-2 block">
                            {answer.question?.title || 'Question'}
                          </Link>
                          <div className="bg-gray-50 p-3 rounded-lg mb-2">
                            <p className="text-gray-700 line-clamp-3">
                              {answer.content}
                            </p>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <FaThumbsUp className="mr-1" />
                            <span className="mr-4">{(answer.upvotes?.length || 0) - (answer.downvotes?.length || 0)} votes</span>
                            {answer.isBestAnswer && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full mr-4">
                                <FaCheck className="inline mr-1" />
                                Best Answer
                              </span>
                            )}
                            <span>{formatTimeAgo(answer.createdAt)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <FaPen className="text-4xl text-gray-300 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-gray-700 mb-2">No answers yet</h4>
                        <p className="text-gray-500">Answers you write will appear here.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'bookmarks' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-900">Bookmarked Questions</h3>
                      <button
                        onClick={fetchBookmarks}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                      >
                        Refresh
                      </button>
                    </div>
                    
                    {userBookmarks.length > 0 ? (
                      <div className="space-y-4">
                        {userBookmarks.map(bookmark => (
                          <div key={bookmark._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <Link to={`/question/${bookmark._id}`} className="text-lg font-semibold text-gray-900 hover:text-blue-600 mb-2 block">
                                  {bookmark.title}
                                </Link>
                                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                  {bookmark.content}
                                </p>
                                
                                {/* Tags */}
                                {bookmark.tags && bookmark.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    {bookmark.tags.slice(0, 3).map((tag, index) => (
                                      <span 
                                        key={index}
                                        className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                                      >
                                        <FaHashtag className="mr-1" size={10} />
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                
                                <div className="flex items-center text-sm text-gray-500">
                                  <div className="flex items-center mr-4">
                                    {bookmark.author?.avatar ? (
                                      <img 
                                        src={bookmark.author.avatar} 
                                        alt={bookmark.author.name}
                                        className="w-5 h-5 rounded-full mr-2"
                                      />
                                    ) : (
                                      <FaUser className="text-gray-400 mr-2" />
                                    )}
                                    <span>{bookmark.author?.name || 'Anonymous'}</span>
                                  </div>
                                  
                                  <div className="flex items-center mr-4">
                                    <FaComment className="mr-1" size={12} />
                                    <span>{bookmark.answersCount || 0} answers</span>
                                  </div>
                                  
                                  <div className="flex items-center mr-4">
                                    <FaThumbsUp className="mr-1" size={12} />
                                    <span>{(bookmark.upvotes?.length || 0) - (bookmark.downvotes?.length || 0)} votes</span>
                                  </div>
                                  
                                  <div className="flex items-center">
                                    <FaEye className="mr-1" size={12} />
                                    <span>{bookmark.views || 0} views</span>
                                  </div>
                                  
                                  <span className="ml-auto text-xs">{formatTimeAgo(bookmark.createdAt)}</span>
                                </div>
                              </div>
                              
                              <div className="ml-4 flex flex-col space-y-2">
                                <button
                                  onClick={() => navigate(`/question/${bookmark._id}`)}
                                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                                >
                                  View
                                </button>
                                <button
                                  className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-100"
                                  title="Remove bookmark"
                                >
                                  <FaRegBookmark size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FaBookmark className="text-4xl text-gray-300 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-gray-700 mb-2">No bookmarks yet</h4>
                        <p className="text-gray-500 mb-4">Questions you bookmark will appear here.</p>
                        <Link to="/home" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          Browse Questions
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* NEW FOLLOWERS TAB */}
                {activeTab === 'followers' && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Your Followers</h3>
                    {loadingFollowers ? (
                      <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-600">Loading followers...</p>
                      </div>
                    ) : followersList.length > 0 ? (
                      <div className="space-y-4">
                        {followersList.map(follower => (
                          <div key={follower._id} className="bg-white border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Link to={`/profile/${follower._id}`} className="flex items-center space-x-3">
                                  {follower.avatar ? (
                                    <img 
                                      src={follower.avatar} 
                                      alt={follower.name}
                                      className="w-12 h-12 rounded-full border"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                                      {follower.name?.charAt(0) || 'U'}
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-semibold text-gray-900">{follower.name}</div>
                                    <div className="text-sm text-gray-500">@{follower.username || 'user'}</div>
                                    {follower.bio && (
                                      <div className="text-sm text-gray-600 mt-1">{follower.bio}</div>
                                    )}
                                  </div>
                                </Link>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="text-center">
                                  <div className="font-bold text-gray-900">{follower.questionsCount || 0}</div>
                                  <div className="text-xs text-gray-500">Questions</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-bold text-gray-900">{follower.followers?.length || 0}</div>
                                  <div className="text-xs text-gray-500">Followers</div>
                                </div>
                                <button
                                  onClick={() => handleFollowUser(follower._id)}
                                  className={`px-4 py-2 rounded-lg font-medium ${
                                    user.following?.includes(follower._id)
                                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                      : 'bg-blue-600 text-white hover:bg-blue-700'
                                  }`}
                                >
                                  {user.following?.includes(follower._id) ? 'Following' : 'Follow'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FaUsers className="text-4xl text-gray-300 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-gray-700 mb-2">No followers yet</h4>
                        <p className="text-gray-500 mb-4">When someone follows you, they will appear here.</p>
                        <Link to="/users" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          Explore Users
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'following' && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Followed Users</h3>
                    {loadingFollowing ? (
                      <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-600">Loading following...</p>
                      </div>
                    ) : followingList.length > 0 ? (
                      <div className="space-y-4">
                        {followingList.map(followed => (
                          <div key={followed._id} className="bg-white border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Link to={`/profile/${followed._id}`} className="flex items-center space-x-3">
                                  {followed.avatar ? (
                                    <img 
                                      src={followed.avatar} 
                                      alt={followed.name}
                                      className="w-12 h-12 rounded-full border"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                                      {followed.name?.charAt(0) || 'U'}
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-semibold text-gray-900">{followed.name}</div>
                                    <div className="text-sm text-gray-500">@{followed.username || 'user'}</div>
                                    {followed.bio && (
                                      <div className="text-sm text-gray-600 mt-1">{followed.bio}</div>
                                    )}
                                  </div>
                                </Link>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="text-center">
                                  <div className="font-bold text-gray-900">{followed.questionsCount || 0}</div>
                                  <div className="text-xs text-gray-500">Questions</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-bold text-gray-900">{followed.followers?.length || 0}</div>
                                  <div className="text-xs text-gray-500">Followers</div>
                                </div>
                                <button
                                  onClick={() => handleFollowUser(followed._id)}
                                  className={`px-4 py-2 rounded-lg font-medium ${
                                    user.following?.includes(followed._id)
                                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                      : 'bg-blue-600 text-white hover:bg-blue-700'
                                  }`}
                                >
                                  Unfollow
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FaUserFriends className="text-4xl text-gray-300 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-gray-700 mb-2">Not following anyone yet</h4>
                        <p className="text-gray-500 mb-4">Follow users to see their content in your feed.</p>
                        <Link to="/users" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          Explore Users
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                <FaHistory className="text-gray-400" />
              </div>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center p-3 hover:bg-gray-50 rounded-lg">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                        activity.type === 'asked' ? 'bg-blue-100 text-blue-600' :
                        activity.type === 'answered' ? 'bg-green-100 text-green-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        <activity.icon />
                      </div>
                      <div className="flex-1">
                        <Link to={activity.link || '#'} className="text-gray-800 hover:text-blue-600">
                          <p>
                            <span className="font-medium capitalize">{activity.type}</span>{' '}
                            {activity.content}
                          </p>
                        </Link>
                        <p className="text-sm text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;