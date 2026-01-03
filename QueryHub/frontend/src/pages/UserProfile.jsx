import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaUser, 
  FaQuestionCircle, 
  FaPen, 
  FaUsers,
  FaUserFriends,
  FaCalendar,
  FaMapMarkerAlt,
  FaLink,
  FaTwitter,
  FaGithub,
  FaLinkedin,
  FaBookmark,
  FaUserPlus,
  FaUserCheck,
  FaEye,
  FaComment,
  FaThumbsUp,
  FaHashtag
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [activeTab, setActiveTab] = useState('questions');
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, [id]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Get user profile
      const profileResponse = await API.get(`/users/${id}`);
      
      if (!profileResponse.data || !profileResponse.data.success) {
        throw new Error('User not found');
      }
      
      setUser(profileResponse.data.user);
      
      // Get user questions - FIXED: Handle response structure properly
      try {
        const questionsResponse = await API.get(`/questions/user/${id}`);
        // Check if response has 'questions' array or is directly an array
        if (questionsResponse.data && questionsResponse.data.questions) {
          setQuestions(questionsResponse.data.questions);
        } else if (Array.isArray(questionsResponse.data)) {
          setQuestions(questionsResponse.data);
        } else {
          setQuestions([]);
        }
      } catch (err) {
        console.error('Error fetching questions:', err);
        setQuestions([]);
      }
      
      // Get user answers - FIXED: Handle response structure properly  
      try {
        const answersResponse = await API.get(`/users/${id}/answers`);
        if (answersResponse.data && answersResponse.data.answers) {
          setAnswers(answersResponse.data.answers);
        } else if (Array.isArray(answersResponse.data)) {
          setAnswers(answersResponse.data);
        } else {
          setAnswers([]);
        }
      } catch (err) {
        console.error('Error fetching answers:', err);
        setAnswers([]);
      }
      
      // Get followers
      try {
        const followersRes = await API.get(`/follow/${id}/followers`);
        if (followersRes.data && followersRes.data.followers) {
          setFollowers(followersRes.data.followers);
        } else {
          setFollowers([]);
        }
      } catch (error) {
        console.error('Error fetching followers:', error);
        setFollowers([]);
      }
      
      // Get following
      try {
        const followingRes = await API.get(`/follow/${id}/following`);
        if (followingRes.data && followingRes.data.following) {
          setFollowing(followingRes.data.following);
        } else {
          setFollowing([]);
        }
      } catch (error) {
        console.error('Error fetching following:', error);
        setFollowing([]);
      }
      
      // Check follow status if not viewing own profile
      if (currentUser && currentUser._id !== id) {
        try {
          const followStatusRes = await API.get(`/follow/${id}/follow-status`);
          setIsFollowing(followStatusRes.data.isFollowing);
        } catch (error) {
          console.error('Error checking follow status:', error);
          setIsFollowing(false);
        }
      }
      
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      const response = await API.post(`/follow/${id}/follow`);
      
      if (response.data.success) {
        setIsFollowing(response.data.following);
        
        // Update followers count
        setUser(prev => ({
          ...prev,
          followersCount: response.data.followersCount || prev.followersCount,
          followingCount: response.data.followingCount !== undefined 
            ? (currentUser._id === id ? response.data.followingCount : prev.followingCount)
            : prev.followingCount
        }));
        
        // Refresh following list if viewing own profile
        if (currentUser._id === id) {
          await fetchUserData();
        } else {
          // Refresh followers list if viewing other user's profile
          if (response.data.following) {
            // Check if current user is not already in the list
            const isInList = followers.some(f => f._id === currentUser._id);
            if (!isInList) {
              setFollowers(prev => [currentUser, ...prev]);
            }
          } else {
            // Remove current user from followers list
            setFollowers(prev => prev.filter(f => f._id !== currentUser._id));
          }
        }
      } else {
        alert(response.data.message || 'Failed to follow user');
      }
      
    } catch (error) {
      console.error('Error toggling follow:', error);
      alert(error.response?.data?.message || 'Failed to follow user');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Recently';
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">User not found</h2>
          <p className="text-gray-600 mb-6">The user you're looking for doesn't exist.</p>
          <Link to="/home" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser._id === id;

  // Safe array handling for activities
  const recentActivities = [];
  
  // Add questions to activities
  if (Array.isArray(questions)) {
    questions.slice(0, 3).forEach(q => {
      recentActivities.push({
        type: 'asked',
        content: q.title,
        timestamp: q.createdAt,
        icon: FaQuestionCircle,
        link: `/question/${q._id}`
      });
    });
  }
  
  // Add answers to activities
  if (Array.isArray(answers)) {
    answers.slice(0, 3).forEach(a => {
      recentActivities.push({
        type: 'answered',
        content: a.question?.title || 'a question',
        timestamp: a.createdAt,
        icon: FaPen,
        link: `/question/${a.question?._id}`
      });
    });
  }
  
  // Sort activities
  const sortedActivities = recentActivities.sort((a, b) => 
    new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
  ).slice(0, 5);

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
            <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
            <div className="w-24"></div>
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
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-5xl font-bold">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                <p className="text-gray-500">@{user.username || 'user'}</p>
                
                {/* Follow Button (if not own profile) */}
                {!isOwnProfile && currentUser && (
                  <button
                    onClick={handleFollowToggle}
                    className={`mt-4 w-full py-3 rounded-lg font-medium flex items-center justify-center transition ${
                      isFollowing 
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <FaUserCheck className="mr-2" />
                        Following
                      </>
                    ) : (
                      <>
                        <FaUserPlus className="mr-2" />
                        Follow
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Bio */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Bio</h3>
                <p className="text-gray-600">
                  {user.bio || 'No bio yet'}
                </p>
              </div>

              {/* Location & Join Date */}
              <div className="space-y-3 mb-6">
                {user.location && (
                  <div className="flex items-center text-gray-600">
                    <FaMapMarkerAlt className="mr-3" />
                    <span>{user.location}</span>
                  </div>
                )}
                <div className="flex items-center text-gray-600">
                  <FaCalendar className="mr-3" />
                  <span>Joined {formatDate(user.createdAt)}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{user.questionsCount || 0}</div>
                  <div className="text-sm text-gray-600">Questions</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{user.answersCount || 0}</div>
                  <div className="text-sm text-gray-600">Answers</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{user.followersCount || 0}</div>
                  <div className="text-sm text-gray-600">Followers</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{user.followingCount || 0}</div>
                  <div className="text-sm text-gray-600">Following</div>
                </div>
              </div>

              {/* Social Links */}
              <div className="pt-4 border-t">
                <div className="flex justify-center space-x-4">
                  {user.website && (
                    <a href={user.website} target="_blank" rel="noopener noreferrer" 
                       className="text-gray-600 hover:text-blue-600" title="Website">
                      <FaLink size={20} />
                    </a>
                  )}
                  {user.twitter && (
                    <a href={`https://twitter.com/${user.twitter}`} target="_blank" rel="noopener noreferrer" 
                       className="text-blue-400 hover:text-blue-500" title="Twitter">
                      <FaTwitter size={20} />
                    </a>
                  )}
                  {user.github && (
                    <a href={`https://github.com/${user.github}`} target="_blank" rel="noopener noreferrer" 
                       className="text-gray-700 hover:text-gray-900" title="GitHub">
                      <FaGithub size={20} />
                    </a>
                  )}
                  {user.linkedin && (
                    <a href={`https://linkedin.com/in/${user.linkedin}`} target="_blank" rel="noopener noreferrer" 
                       className="text-blue-600 hover:text-blue-700" title="LinkedIn">
                      <FaLinkedin size={20} />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Followers/Following Preview */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex space-x-4 mb-4">
                <button
                  onClick={() => setActiveTab('followers')}
                  className={`flex-1 py-2 text-center rounded-lg ${
                    activeTab === 'followers' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="text-xl font-bold">{user.followersCount || 0}</div>
                  <div className="text-sm">Followers</div>
                </button>
                <button
                  onClick={() => setActiveTab('following')}
                  className={`flex-1 py-2 text-center rounded-lg ${
                    activeTab === 'following' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="text-xl font-bold">{user.followingCount || 0}</div>
                  <div className="text-sm">Following</div>
                </button>
              </div>
              
              {/* Recent Followers/Following */}
              <div className="space-y-3">
                {activeTab === 'followers' ? (
                  Array.isArray(followers) && followers.length > 0 ? (
                    followers.slice(0, 5).map(follower => (
                      <div key={follower._id} className="flex items-center p-2 hover:bg-gray-50 rounded">
                        <img 
                          src={follower.avatar} 
                          alt={follower.name}
                          className="w-8 h-8 rounded-full mr-3"
                        />
                        <div className="flex-1">
                          <Link to={`/profile/${follower._id}`} className="font-medium text-gray-900 hover:text-blue-600 text-sm">
                            {follower.name}
                          </Link>
                          <p className="text-xs text-gray-500">@{follower.username}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-2">No followers yet</p>
                  )
                ) : (
                  Array.isArray(following) && following.length > 0 ? (
                    following.slice(0, 5).map(followed => (
                      <div key={followed._id} className="flex items-center p-2 hover:bg-gray-50 rounded">
                        <img 
                          src={followed.avatar} 
                          alt={followed.name}
                          className="w-8 h-8 rounded-full mr-3"
                        />
                        <div className="flex-1">
                          <Link to={`/profile/${followed._id}`} className="font-medium text-gray-900 hover:text-blue-600 text-sm">
                            {followed.name}
                          </Link>
                          <p className="text-xs text-gray-500">@{followed.username}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-2">Not following anyone yet</p>
                  )
                )}
                
                {(activeTab === 'followers' ? followers.length : following.length) > 5 && (
                  <Link 
                    to={`/profile/${id}/${activeTab}`}
                    className="block text-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View all →
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-2/3">
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border mb-6">
              <div className="flex border-b overflow-x-auto">
                <button
                  onClick={() => setActiveTab('questions')}
                  className={`py-4 px-6 text-center font-medium whitespace-nowrap ${
                    activeTab === 'questions' 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FaQuestionCircle className="inline mr-2" />
                  Questions ({Array.isArray(questions) ? questions.length : 0})
                </button>
                <button
                  onClick={() => setActiveTab('answers')}
                  className={`py-4 px-6 text-center font-medium whitespace-nowrap ${
                    activeTab === 'answers' 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FaPen className="inline mr-2" />
                  Answers ({Array.isArray(answers) ? answers.length : 0})
                </button>
                <button
                  onClick={() => setActiveTab('followers')}
                  className={`py-4 px-6 text-center font-medium whitespace-nowrap ${
                    activeTab === 'followers' 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FaUsers className="inline mr-2" />
                  Followers ({user.followersCount || 0})
                </button>
                <button
                  onClick={() => setActiveTab('following')}
                  className={`py-4 px-6 text-center font-medium whitespace-nowrap ${
                    activeTab === 'following' 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FaUserFriends className="inline mr-2" />
                  Following ({user.followingCount || 0})
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'questions' && (
                  <div className="space-y-4">
                    {Array.isArray(questions) && questions.length > 0 ? (
                      questions.map(question => (
                        <div key={question._id} className="border-b border-gray-200 pb-4 last:border-0">
                          <Link 
                            to={`/question/${question._id}`}
                            className="text-lg font-semibold text-gray-900 hover:text-blue-600 mb-2 block"
                          >
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
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'answers' && (
                  <div className="space-y-4">
                    {Array.isArray(answers) && answers.length > 0 ? (
                      answers.map(answer => (
                        <div key={answer._id} className="border-b border-gray-200 pb-4 last:border-0">
                          <Link 
                            to={`/question/${answer.question?._id}`}
                            className="text-lg font-semibold text-gray-900 hover:text-blue-600 mb-2 block"
                          >
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
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'followers' && (
                  <div className="space-y-4">
                    {Array.isArray(followers) && followers.length > 0 ? (
                      followers.map(follower => (
                        <div key={follower._id} className="bg-white rounded-lg border p-4">
                          <div className="flex items-center space-x-3">
                            <img 
                              src={follower.avatar} 
                              alt={follower.name}
                              className="w-12 h-12 rounded-full border"
                            />
                            <div className="flex-1">
                              <Link to={`/profile/${follower._id}`} className="font-semibold text-gray-900 hover:text-blue-600">
                                {follower.name}
                              </Link>
                              <p className="text-gray-500 text-sm">@{follower.username}</p>
                              {follower.bio && (
                                <p className="text-gray-600 text-sm mt-1">{follower.bio}</p>
                              )}
                            </div>
                            {currentUser && currentUser._id !== follower._id && (
                              <button
                                onClick={async () => {
                                  try {
                                    await API.post(`/follow/${follower._id}/follow`);
                                    fetchUserData();
                                  } catch (error) {
                                    console.error('Error following:', error);
                                  }
                                }}
                                className={`px-4 py-2 rounded-lg font-medium ${
                                  currentUser?.following?.includes(follower._id)
                                    ? 'bg-gray-100 text-gray-700'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                              >
                                {currentUser?.following?.includes(follower._id) ? 'Following' : 'Follow'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <FaUsers className="text-4xl text-gray-300 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-gray-700 mb-2">No followers yet</h4>
                        <p className="text-gray-500">When someone follows this user, they'll appear here.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'following' && (
                  <div className="space-y-4">
                    {Array.isArray(following) && following.length > 0 ? (
                      following.map(followed => (
                        <div key={followed._id} className="bg-white rounded-lg border p-4">
                          <div className="flex items-center space-x-3">
                            <img 
                              src={followed.avatar} 
                              alt={followed.name}
                              className="w-12 h-12 rounded-full border"
                            />
                            <div className="flex-1">
                              <Link to={`/profile/${followed._id}`} className="font-semibold text-gray-900 hover:text-blue-600">
                                {followed.name}
                              </Link>
                              <p className="text-gray-500 text-sm">@{followed.username}</p>
                              {followed.bio && (
                                <p className="text-gray-600 text-sm mt-1">{followed.bio}</p>
                              )}
                            </div>
                            {currentUser && currentUser._id !== followed._id && (
                              <button
                                onClick={async () => {
                                  try {
                                    await API.post(`/follow/${followed._id}/follow`);
                                    fetchUserData();
                                  } catch (error) {
                                    console.error('Error following:', error);
                                  }
                                }}
                                className={`px-4 py-2 rounded-lg font-medium ${
                                  currentUser?.following?.includes(followed._id)
                                    ? 'bg-gray-100 text-gray-700'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                              >
                                {currentUser?.following?.includes(followed._id) ? 'Following' : 'Follow'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <FaUserFriends className="text-4xl text-gray-300 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-gray-700 mb-2">Not following anyone yet</h4>
                        <p className="text-gray-500">When this user follows someone, they'll appear here.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {sortedActivities.length > 0 ? (
                  sortedActivities.map((activity, index) => (
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

export default UserProfile;