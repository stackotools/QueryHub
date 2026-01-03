import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaBookmark, 
  FaRegBookmark, 
  FaSearch,
  FaFilter,
  FaTrash,
  FaClock,
  FaComment,
  FaEye,
  FaHashtag,
  FaUser
} from 'react-icons/fa';
import { getUserBookmarks } from '../services/bookmarkService';
import { useAuth } from '../context/AuthContext';

const Bookmarks = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchBookmarks();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const response = await getUserBookmarks(user._id);
      
      if (response.success) {
        setBookmarks(response.bookmarks || []);
      } else {
        setBookmarks([]);
      }
      setError('');
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
      setError('Failed to load bookmarks');
      setBookmarks([]);
    } finally {
      setLoading(false);
    }
  };

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

  const filteredBookmarks = bookmarks.filter(bookmark => 
    bookmark.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bookmark.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bookmark.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please login to view bookmarks</h2>
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
            <h1 className="text-2xl font-bold text-gray-900">My Bookmarks</h1>
            <div className="w-24"></div>
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
              placeholder="Search bookmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{bookmarks.length}</div>
                <div className="text-sm text-gray-600">Total Bookmarks</div>
              </div>
            </div>
            <button
              onClick={fetchBookmarks}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Bookmarks List */}
        <div className="bg-white rounded-xl shadow-sm border">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading bookmarks...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <FaRegBookmark className="text-4xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Error loading bookmarks</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <button 
                onClick={fetchBookmarks}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : filteredBookmarks.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredBookmarks.map((bookmark) => (
                <div key={bookmark._id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <Link to={`/question/${bookmark._id}`} className="group">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 mb-2">
                          {bookmark.title}
                        </h3>
                      </Link>
                      
                      <p className="text-gray-600 mb-3 line-clamp-2">
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
                      
                      {/* Meta Info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
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
                          
                          <div className="flex items-center">
                            <FaClock className="mr-1" size={12} />
                            <span>{formatTime(bookmark.createdAt)}</span>
                          </div>
                          
                          <div className="flex items-center">
                            <FaComment className="mr-1" size={12} />
                            <span>{bookmark.answersCount || 0} answers</span>
                          </div>
                          
                          <div className="flex items-center">
                            <FaEye className="mr-1" size={12} />
                            <span>{bookmark.views?.toLocaleString() || 0} views</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">
                            {(bookmark.upvotes?.length || 0) - (bookmark.downvotes?.length || 0)} votes
                          </span>
                          <button
                            onClick={() => navigate(`/question/${bookmark._id}`)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FaRegBookmark className="text-4xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No bookmarks yet</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery ? 'No bookmarks match your search' : 'Questions you bookmark will appear here'}
              </p>
              <Link to="/home" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Browse Questions
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Bookmarks;