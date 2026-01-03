// frontend/src/components/users/UserCard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaUser, 
  FaQuestionCircle, 
  FaPen, 
  FaUsers,
  FaUserPlus,
  FaUserCheck,
  FaMapMarkerAlt,
  FaBriefcase,
  FaStar
} from 'react-icons/fa';
import { followUser, getFollowStatus } from '../../services/followService';
import { useAuth } from '../../context/AuthContext';

const UserCard = ({ user, showFollowButton = true, size = 'medium' }) => {
  const { user: currentUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(user.followers || 0);
  const [followingCount, setFollowingCount] = useState(user.following || 0);

  useEffect(() => {
    if (currentUser && user._id !== currentUser._id) {
      checkFollowStatus();
    }
  }, [user._id, currentUser]);

  const checkFollowStatus = async () => {
    try {
      const response = await getFollowStatus(user._id);
      setIsFollowing(response.isFollowing);
      
      // Update counts from response if available
      if (response.followersCount !== undefined) {
        setFollowersCount(response.followersCount);
      }
      if (response.followingCount !== undefined) {
        setFollowingCount(response.followingCount);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser) {
      alert('Please login to follow users');
      return;
    }

    if (user._id === currentUser._id) {
      alert('You cannot follow yourself');
      return;
    }

    if (loading) return;

    try {
      setLoading(true);
      const response = await followUser(user._id);
      
      setIsFollowing(response.following);
      setFollowersCount(response.followersCount || followersCount + (response.following ? 1 : -1));
      
      if (response.message) {
        console.log(response.message);
      }
      
    } catch (error) {
      console.error('Error following user:', error);
      alert(error.response?.data?.message || 'Failed to follow user');
    } finally {
      setLoading(false);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          card: 'p-3',
          avatar: 'w-10 h-10',
          name: 'text-sm',
          stats: 'text-xs'
        };
      case 'large':
        return {
          card: 'p-6',
          avatar: 'w-24 h-24',
          name: 'text-2xl',
          stats: 'text-base'
        };
      default:
        return {
          card: 'p-4',
          avatar: 'w-16 h-16',
          name: 'text-lg',
          stats: 'text-sm'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${sizeClasses.card} hover:shadow-md transition-shadow`}>
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <Link to={`/profile/${user._id}`}>
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.name}
              className={`${sizeClasses.avatar} rounded-full border-2 border-white shadow-md`}
            />
          ) : (
            <div className={`${sizeClasses.avatar} rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold`}>
              {user.name?.charAt(0) || 'U'}
            </div>
          )}
        </Link>

        <div className="flex-1">
          {/* Name and Username */}
          <div className="flex justify-between items-start">
            <div>
              <Link to={`/profile/${user._id}`}>
                <h3 className={`font-bold text-gray-900 hover:text-blue-600 ${sizeClasses.name}`}>
                  {user.name}
                </h3>
              </Link>
              <p className="text-gray-500 text-sm">@{user.username}</p>
            </div>

            {/* Follow Button */}
            {showFollowButton && currentUser && user._id !== currentUser._id && (
              <button
                onClick={handleFollowToggle}
                disabled={loading}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                } ${
                  isFollowing 
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {loading ? (
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                ) : isFollowing ? (
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
          {user.bio && (
            <p className="text-gray-600 mt-2 line-clamp-2">
              {user.bio}
            </p>
          )}

          {/* Location and Expertise */}
          <div className="flex flex-wrap gap-2 mt-3">
            {user.location && (
              <span className="inline-flex items-center text-gray-500 text-xs">
                <FaMapMarkerAlt className="mr-1" />
                {user.location}
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="flex space-x-6 mt-4">
            <div className="text-center">
              <div className={`font-bold text-gray-900 ${sizeClasses.stats}`}>
                {user.questionsCount || 0}
              </div>
              <div className="text-gray-500 text-xs">
                <FaQuestionCircle className="inline mr-1" />
                Questions
              </div>
            </div>
            <div className="text-center">
              <div className={`font-bold text-gray-900 ${sizeClasses.stats}`}>
                {user.answersCount || 0}
              </div>
              <div className="text-gray-500 text-xs">
                <FaPen className="inline mr-1" />
                Answers
              </div>
            </div>
            <div className="text-center">
              <div className={`font-bold text-gray-900 ${sizeClasses.stats}`}>
                {followersCount}
              </div>
              <div className="text-gray-500 text-xs">
                <FaUsers className="inline mr-1" />
                Followers
              </div>
            </div>
            <div className="text-center">
              <div className={`font-bold text-gray-900 ${sizeClasses.stats}`}>
                {followingCount}
              </div>
              <div className="text-gray-500 text-xs">
                <FaUser className="inline mr-1" />
                Following
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCard;