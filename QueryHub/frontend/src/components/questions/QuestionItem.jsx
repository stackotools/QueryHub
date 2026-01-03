import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaThumbsUp, 
  FaComment, 
  FaEye, 
  FaBookmark, 
  FaShare, 
  FaEllipsisH,
  FaThumbsUp as FaThumbsUpSolid,
  FaBookmark as FaBookmarkSolid,
  FaHashtag,
  FaClock,
  FaRegThumbsUp,
  FaRegBookmark,
  FaUserPlus,
  FaUserCheck,
  FaTrash
  
} from 'react-icons/fa';
import { upvoteQuestion, downvoteQuestion, deleteQuestion } from '../../services/questionService';
import { bookmarkQuestion, getBookmarkStatus } from '../../services/bookmarkService';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';

const QuestionItem = ({ question, refreshQuestions }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(question.upvotes?.length || 0);
  const [downvoteCount, setDownvoteCount] = useState(question.downvotes?.length || 0);
  const [loading, setLoading] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Check initial bookmark status
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (user && question._id) {
        try {
          const response = await getBookmarkStatus(question._id);
          setIsBookmarked(response.bookmarked);
        } catch (error) {
          console.error('Error checking bookmark status:', error);
        }
      }
    };
    
    checkBookmarkStatus();
  }, [user, question._id]);

  // Check initial upvote status
  useEffect(() => {
    if (user && question.upvotes) {
      setIsUpvoted(question.upvotes.includes(user._id));
    }
  }, [user, question.upvotes]);

  // Check initial follow status
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (user && question.author?._id && user._id !== question.author._id) {
        try {
          const response = await API.get(`/follow/${question.author._id}/follow-status`);
          setIsFollowing(response.data.isFollowing);
        } catch (error) {
          console.error('Error checking follow status:', error);
          setIsFollowing(false);
        }
      }
    };
    
    if (question.author?._id) {
      checkFollowStatus();
    }
  }, [user, question.author?._id]);

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Recently';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // FOLLOW FUNCTION - FIXED VERSION
  const handleFollow = async () => {
    if (!user) {
      alert('Please login to follow users');
      return;
    }
    
    if (!question.author?._id) {
      alert('User information not available');
      return;
    }
    
    if (followLoading) return;
    
    try {
      setFollowLoading(true);
      console.log(`Following user: ${question.author._id}`);
      
      const response = await API.post(`/follow/${question.author._id}/follow`);
      
      console.log('Follow response:', response.data);
      
      if (response.data && response.data.success) {
        setIsFollowing(response.data.following);
        
        if (response.data.message) {
          console.log(response.data.message);
        }
        
        // Show success message
        alert(response.data.following ? 'Successfully followed!' : 'Successfully unfollowed!');
      } else {
        alert('Failed to follow user');
      }
      
    } catch (error) {
      console.error('Error following user:', error);
      
      if (error.response) {
        console.error('Error response:', error.response.data);
        alert(error.response.data?.message || 'Failed to follow user');
      } else if (error.request) {
        console.error('No response received:', error.request);
        alert('Network error. Please check if backend is running.');
      } else {
        console.error('Error:', error.message);
        alert('An error occurred. Please try again.');
      }
    } finally {
      setFollowLoading(false);
    }
  };

  // UPVOTE FUNCTION
  const handleUpvote = async () => {
    if (!user) {
      alert('Please login to upvote questions');
      return;
    }
    
    if (loading) return;
    
    try {
      setLoading(true);
      
      // Always call upvote - backend handles toggle logic
      const response = await upvoteQuestion(question._id);
      
      // Update state based on response
      if (response) {
        setUpvoteCount(response.upvotesCount || 0);
        setDownvoteCount(response.downvotesCount || 0);
        // Check if user is in upvotes array to determine if upvoted
        // Since we toggled, flip the state
        setIsUpvoted(!isUpvoted);
      }
      
      if (refreshQuestions) {
        refreshQuestions();
      }
      
    } catch (error) {
      console.error('Error upvoting:', error);
      if (error.response?.status === 401) {
        alert('Please login to vote');
      } else {
        alert('Failed to vote. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // BOOKMARK FUNCTION
  const handleBookmark = async () => {
    if (!user) {
      alert('Please login to bookmark questions');
      return;
    }
    
    if (bookmarkLoading) return;
    
    try {
      setBookmarkLoading(true);
      
      const response = await bookmarkQuestion(question._id);
      
      if (response && response.success !== undefined) {
        setIsBookmarked(response.bookmarked || false);
        
        if (response.bookmarked) {
          console.log('Question bookmarked');
        } else {
          console.log('Bookmark removed');
        }
      } else {
        // Handle response without success field
        setIsBookmarked(response.bookmarked || false);
      }
      
    } catch (error) {
      console.error('Error bookmarking:', error);
      if (error.response?.status === 401) {
        alert('Please login to bookmark');
      } else {
        alert('Failed to bookmark. Please try again.');
      }
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: question.title,
        text: question.content?.substring(0, 100),
        url: window.location.origin + `/question/${question._id}`
      });
    } else {
      navigator.clipboard.writeText(window.location.origin + `/question/${question._id}`);
      alert('Link copied to clipboard!');
    }
  };

  const voteScore = upvoteCount - downvoteCount;

  // Check if current user is the question author
  const isCurrentUserAuthor = user && question.author?._id === user._id;

  // Delete question handler
  const handleDeleteQuestion = async () => {
    if (!user || !isCurrentUserAuthor) return;
    
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await deleteQuestion(question._id);
        if (refreshQuestions) {
          refreshQuestions();
        } else {
          navigate('/home');
        }
      } catch (error) {
        console.error('Error deleting question:', error);
        alert('Failed to delete question');
      }
    }
    setShowMenu(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4 hover:shadow-md transition-shadow">
      {/* Question Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <Link to={`/profile/${question.author?._id}`}>
            {question.author?.avatar ? (
              <img 
                src={question.author.avatar} 
                alt={question.author.name}
                className="w-10 h-10 rounded-full border hover:ring-2 hover:ring-blue-500"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold hover:bg-blue-700">
                {question.author?.name?.charAt(0) || 'A'}
              </div>
            )}
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <Link to={`/profile/${question.author?._id}`} className="font-semibold text-gray-900 hover:text-blue-600">
                {question.isAnonymous ? 'Anonymous' : (question.author?.name || 'User')}
              </Link>
              
              {/* FOLLOW BUTTON - Only show if not current user's question */}
              {!isCurrentUserAuthor && question.author?._id && user && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`px-2 py-1 text-xs rounded-full transition flex items-center justify-center ${
                    followLoading ? 'opacity-50 cursor-not-allowed' : ''
                  } ${
                    isFollowing 
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                      : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  }`}
                  title={isFollowing ? "Following" : "Follow"}
                >
                  {followLoading ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                  ) : isFollowing ? (
                    <FaUserCheck size={10} />
                  ) : (
                    <FaUserPlus size={10} />
                  )}
                </button>
              )}
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span className="flex items-center">
                <FaClock className="mr-1" size={12} />
                {formatTime(question.createdAt)}
              </span>
              <span>•</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                {question.category || 'General'}
              </span>
            </div>
          </div>
        </div>
        {isCurrentUserAuthor && (
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <FaEllipsisH />
            </button>
            {showMenu && (
              <>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                  <button
                    onClick={handleDeleteQuestion}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center"
                  >
                    <FaTrash className="mr-2" />
                    Delete Question
                  </button>
                </div>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)}
                ></div>
              </>
            )}
          </div>
        )}
      </div>
      {showMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowMenu(false)}
        ></div>
      )}

      {/* Question Title & Content */}
      <Link to={`/question/${question._id}`}>
        <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600">
          {question.title}
        </h3>
      </Link>
      <p className="text-gray-600 mb-4 line-clamp-2">
        {question.content}
      </p>

      {/* Tags */}
      {question.tags && question.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {question.tags.slice(0, 3).map((tag, index) => (
            <span 
              key={index}
              className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200"
            >
              <FaHashtag className="mr-1" size={12} />
              {tag}
            </span>
          ))}
          {question.tags.length > 3 && (
            <span className="px-3 py-1 bg-gray-100 text-gray-500 text-sm rounded-full">
              +{question.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Question Stats & Actions */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="flex items-center space-x-6">
          {/* Voting */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleUpvote}
              disabled={loading}
              className={`flex items-center space-x-2 px-3 py-1 rounded-lg transition ${
                isUpvoted 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-100'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : isUpvoted ? (
                <FaThumbsUpSolid />
              ) : (
                <FaRegThumbsUp />
              )}
              <span className="font-medium">{voteScore}</span>
            </button>

            {/* Answers */}
            <Link 
              to={`/question/${question._id}`}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600"
            >
              <FaComment />
              <span>{question.answersCount || 0} answers</span>
            </Link>

            {/* Views */}
            <div className="flex items-center space-x-2 text-gray-500">
              <FaEye />
              <span>{question.views?.toLocaleString() || 0} views</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Bookmark Button */}
          <button 
            onClick={handleBookmark}
            disabled={bookmarkLoading}
            className={`p-2 rounded-full transition ${
              bookmarkLoading ? 'opacity-50 cursor-not-allowed' : ''
            } ${
              isBookmarked 
                ? 'text-yellow-500 hover:text-yellow-600 bg-yellow-50' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title={isBookmarked ? "Remove bookmark" : "Bookmark question"}
          >
            {bookmarkLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            ) : isBookmarked ? (
              <FaBookmarkSolid />
            ) : (
              <FaRegBookmark />
            )}
          </button>

          {/* Share Button */}
          <button 
            onClick={handleShare}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
            title="Share"
          >
            <FaShare />
          </button>

          {/* Answer Button */}
          <Link 
            to={`/question/${question._id}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Answer
          </Link>
        </div>
      </div>
    </div>
  );
};

export default QuestionItem;