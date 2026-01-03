// frontend/src/pages/Discover.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  FaFire, 
  FaEye, 
  FaComment, 
  FaThumbsUp, 
  FaArrowLeft,
  FaSearch,
  FaFilter,
  FaHashtag,
  FaClock,
  FaUser,
  FaSortAmountDown,
  FaStar,
  FaChartLine,
  FaUsers,
  FaQuestionCircle,
  FaTimes
} from 'react-icons/fa';
import QuestionItem from '../components/questions/QuestionItem';
import { getQuestions } from '../services/questionService';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

const Discover = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('most-viewed');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [trendingTags, setTrendingTags] = useState([]);
  const [stats, setStats] = useState({
    totalQuestions: 0,
    totalAnswers: 0,
    totalViews: 0,
    totalUpvotes: 0
  });
  
  // URL से tag parameter पढ़ने के लिए
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTag, setSelectedTag] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Available categories
  const categories = [
    'All Categories',
    'Technology',
    'Programming',
    'Science',
    'Mathematics',
    'Business',
    'Career',
    'Education',
    'Health',
    'Arts & Culture',
    'Other'
  ];

  useEffect(() => {
    // URL से tag parameter check करें
    const tagFromUrl = searchParams.get('tag');
    if (tagFromUrl) {
      setSelectedTag(tagFromUrl);
      // Search box में भी show करें (capitalized)
      setSearchQuery(tagFromUrl.charAt(0).toUpperCase() + tagFromUrl.slice(1));
      // ✅ Ensure first fetch uses URL tag immediately
      fetchQuestions(tagFromUrl);
    } else {
      fetchQuestions();
    }
    
    fetchTrendingTags();
  }, [activeFilter, selectedCategory, selectedTag, searchParams]);

  const fetchQuestions = async (tagOverride) => {
    try {
      setLoading(true);
      const effectiveTag = tagOverride !== undefined && tagOverride !== null && tagOverride !== ''
        ? tagOverride
        : selectedTag;

      console.log(`Fetching questions with filter: ${activeFilter}, category: ${selectedCategory}, tag: ${effectiveTag}`);
      
      // API call with sorting based on active filter
      let sortParam = 'newest';
      
      switch (activeFilter) {
        case 'most-viewed':
          sortParam = 'most-viewed';
          break;
        case 'most-answered':
          sortParam = 'most-answered';
          break;
        case 'most-upvoted':
          sortParam = 'most-voted';
          break;
        default:
          sortParam = 'newest';
      }
      
      // Tag filter add किया
      let url = `/questions?sort=${sortParam}`;
      if (effectiveTag) {
        url += `&tag=${encodeURIComponent(effectiveTag)}`;
      }
      
      console.log('Fetching URL:', url);
      const response = await API.get(url);
      
      console.log('Questions response:', response.data);
      
      let questionsData = [];
      if (response.data && response.data.questions) {
        questionsData = response.data.questions;
      } else if (Array.isArray(response.data)) {
        questionsData = response.data;
      }
      
      // Filter by category if selected
      if (selectedCategory !== 'all') {
        questionsData = questionsData.filter(q => 
          q.category === selectedCategory
        );
      }
      
      // Filter out new/low quality content
      questionsData = questionsData.filter(question => {
        // Remove questions with very low engagement
        const upvotes = question.upvotes?.length || 0;
        const answers = question.answersCount || 0;
        const views = question.views || 0;
        
        // Quality threshold
        return (upvotes > 0 || answers > 0 || views > 10);
      });
      
      // Sort based on active filter
      questionsData = sortQuestions(questionsData);
      
      setQuestions(questionsData);
      
      // Calculate stats
      calculateStats(questionsData);
      
    } catch (error) {
      console.error('Error fetching questions:', error);
      setQuestions([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const sortQuestions = (questionsList) => {
    switch (activeFilter) {
      case 'most-viewed':
        return [...questionsList].sort((a, b) => 
          (b.views || 0) - (a.views || 0)
        );
      case 'most-answered':
        return [...questionsList].sort((a, b) => 
          (b.answersCount || 0) - (a.answersCount || 0)
        );
      case 'most-upvoted':
        return [...questionsList].sort((a, b) => {
          const aUpvotes = a.upvotes?.length || 0;
          const aDownvotes = a.downvotes?.length || 0;
          const bUpvotes = b.upvotes?.length || 0;
          const bDownvotes = b.downvotes?.length || 0;
          const aScore = aUpvotes - aDownvotes;
          const bScore = bUpvotes - bDownvotes;
          return bScore - aScore;
        });
      default:
        return [...questionsList].sort((a, b) => 
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
    }
  };

  const fetchTrendingTags = async () => {
    try {
      const response = await API.get('/questions');
      const allQuestions = response.data?.questions || [];
      
      // Extract and count tags
      const tagCounts = {};
      allQuestions.forEach(q => {
        q.tags?.forEach(tag => {
          if (tag && typeof tag === 'string') {
            const cleanTag = tag.trim().toLowerCase();
            if (cleanTag) {
              tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
            }
          }
        });
      });
      
      // Convert to array and sort
      const trending = Object.entries(tagCounts)
        .map(([name, count]) => ({ 
          name: name.charAt(0).toUpperCase() + name.slice(1), 
          count 
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      setTrendingTags(trending);
      
    } catch (error) {
      console.error('Error fetching trending tags:', error);
    }
  };

  const calculateStats = (questionsList) => {
    const stats = {
      totalQuestions: questionsList.length,
      totalAnswers: questionsList.reduce((sum, q) => sum + (q.answersCount || 0), 0),
      totalViews: questionsList.reduce((sum, q) => sum + (q.views || 0), 0),
      totalUpvotes: questionsList.reduce((sum, q) => sum + (q.upvotes?.length || 0), 0)
    };
    setStats(stats);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      try {
        setLoading(true);
        setIsSearching(true);
        const response = await API.get(`/questions?search=${encodeURIComponent(searchQuery)}`);
        const questionsData = response.data?.questions || [];
        setQuestions(questionsData);
        calculateStats(questionsData);
        
        // Clear tag filter if searching
        if (selectedTag) {
          setSelectedTag('');
          setSearchParams({});
        }
      } catch (error) {
        console.error('Error searching questions:', error);
      } finally {
        setLoading(false);
      }
    } else {
      // Clear search
      setSearchQuery('');
      setIsSearching(false);
      if (selectedTag) {
        // If tag is selected, keep it
        fetchQuestions();
      } else {
        // If no tag, show all
        setSelectedCategory('all');
        fetchQuestions();
      }
    }
  };

  // Tag click handler
  const handleTagClick = (tag) => {
    const lowercaseTag = tag.toLowerCase();
    setSelectedTag(lowercaseTag);
    setSearchQuery(tag); // Show capitalized tag in search
    // Clear other filters
    setSelectedCategory('all');
    setActiveFilter('newest');
    
    // Update URL
    setSearchParams({ tag: lowercaseTag });
    
    // Scroll to top
    window.scrollTo(0, 0);
  };

  // Clear tag filter
  const handleClearTag = () => {
    setSelectedTag('');
    setSearchQuery('');
    setSearchParams({});
    setSelectedCategory('all');
    fetchQuestions();
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    if (selectedTag) {
      // Keep tag filter
      fetchQuestions();
    } else {
      setSelectedCategory('all');
      fetchQuestions();
    }
  };

  const getFilterIcon = () => {
    switch (activeFilter) {
      case 'most-viewed': return <FaEye className="inline mr-2" />;
      case 'most-answered': return <FaComment className="inline mr-2" />;
      case 'most-upvoted': return <FaThumbsUp className="inline mr-2" />;
      default: return <FaFire className="inline mr-2" />;
    }
  };

  const getFilterTitle = () => {
    switch (activeFilter) {
      case 'most-viewed': return 'Most Viewed';
      case 'most-answered': return 'Most Answered';
      case 'most-upvoted': return 'Most Upvoted';
      default: return 'Trending';
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  // Get questions count by category
  const getCategoryCount = (category) => {
    if (selectedTag) {
      return questions.filter(q => q.category === category && 
        q.tags?.some(t => t.toLowerCase() === selectedTag)).length;
    }
    return questions.filter(q => q.category === category).length;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <FaArrowLeft className="mr-2" />
              Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Discover Questions</h1>
            <div className="text-gray-600">{questions.length} questions</div>
          </div>
        </div>
      </header>

      {/* Show selected tag if any */}
      {selectedTag && (
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaHashtag className="text-blue-500 mr-2" />
                <span className="font-medium text-gray-900">
                  Showing questions tagged: <span className="text-blue-600 font-bold">
                    {selectedTag.charAt(0).toUpperCase() + selectedTag.slice(1)}
                  </span>
                </span>
              </div>
              <button
                onClick={handleClearTag}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
              >
                <FaTimes className="mr-1" />
                Clear filter
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="lg:w-3/4">
            {/* Stats Banner */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white mb-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Top Quality Content</h2>
                  <p className="opacity-90">Discover the most engaging questions from our community</p>
                </div>
                <div className="text-4xl">
                  <FaChartLine />
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">{formatNumber(stats.totalQuestions)}</div>
                  <div className="text-sm opacity-80">Questions</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{formatNumber(stats.totalAnswers)}</div>
                  <div className="text-sm opacity-80">Answers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{formatNumber(stats.totalViews)}</div>
                  <div className="text-sm opacity-80">Views</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{formatNumber(stats.totalUpvotes)}</div>
                  <div className="text-sm opacity-80">Upvotes</div>
                </div>
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search questions or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-20 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <FaTimes />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="absolute right-2 top-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </form>

              {/* Category Filters */}
              <div className="mb-4">
                <h3 className="font-medium text-gray-700 mb-2">Filter by Category:</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        const catValue = category === 'All Categories' ? 'all' : category;
                        setSelectedCategory(catValue);
                        // Clear tag if changing category
                        if (selectedTag && catValue !== 'all') {
                          setSelectedTag('');
                          setSearchParams({});
                          setSearchQuery('');
                        }
                      }}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                        selectedCategory === (category === 'All Categories' ? 'all' : category)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Filters */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setActiveFilter('most-viewed');
                    if (isSearching) setIsSearching(false);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium flex items-center ${
                    activeFilter === 'most-viewed'
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FaEye className="mr-2" />
                  Most Viewed
                </button>
                <button
                  onClick={() => {
                    setActiveFilter('most-answered');
                    if (isSearching) setIsSearching(false);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium flex items-center ${
                    activeFilter === 'most-answered'
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FaComment className="mr-2" />
                  Most Answered
                </button>
                <button
                  onClick={() => {
                    setActiveFilter('most-upvoted');
                    if (isSearching) setIsSearching(false);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium flex items-center ${
                    activeFilter === 'most-upvoted'
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FaThumbsUp className="mr-2" />
                  Most Upvoted
                </button>
                <button
                  onClick={() => {
                    setActiveFilter('newest');
                    if (isSearching) setIsSearching(false);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium flex items-center ${
                    activeFilter === 'newest'
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FaClock className="mr-2" />
                  Newest
                </button>
                <div className="flex-1"></div>
                <div className="flex items-center text-gray-600">
                  <FaSortAmountDown className="mr-2" />
                  <span>Sorted by: {getFilterTitle()}</span>
                </div>
              </div>
            </div>

            {/* Questions Feed */}
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  {getFilterIcon()}
                  {getFilterTitle()} Questions
                  {selectedTag && (
                    <span className="ml-2 text-sm bg-blue-100 text-blue-600 px-3 py-1 rounded-full flex items-center">
                      <FaHashtag className="mr-1" />
                      {selectedTag.charAt(0).toUpperCase() + selectedTag.slice(1)}
                    </span>
                  )}
                  <span className="ml-2 text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {questions.length}
                  </span>
                </h2>
                <button
                  onClick={fetchQuestions}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <FaSearch className="mr-2" />
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600">Loading quality content...</p>
                </div>
              ) : questions.length > 0 ? (
                <div className="space-y-6">
                  {questions.map(question => (
                    <QuestionItem 
                      key={question._id} 
                      question={question} 
                      refreshQuestions={fetchQuestions}
                      onTagClick={handleTagClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                  <FaQuestionCircle className="text-4xl text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No questions found
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {selectedTag 
                      ? `No questions found with tag "${selectedTag}"`
                      : selectedCategory !== 'all' 
                      ? `No ${activeFilter.replace('most-', '')} questions found in ${selectedCategory}`
                      : isSearching
                      ? `No results found for "${searchQuery}"`
                      : `No ${activeFilter.replace('most-', '')} questions found`}
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSearchQuery('');
                      setSelectedTag('');
                      setSearchParams({});
                      fetchQuestions();
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Show All Questions
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/4">
            {/* Trending Tags - Sticky Position */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-lg">🔥 Trending Topics</h3>
                <FaFire className="text-orange-500" />
              </div>
              <div className="space-y-2">
                {trendingTags.length > 0 ? (
                  trendingTags.map((tag, index) => (
                    <button
                      key={index}
                      onClick={() => handleTagClick(tag.name)}
                      className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group transition"
                    >
                      <div className="flex items-center">
                        <FaHashtag className="text-gray-400 mr-2 group-hover:text-blue-500" />
                        <span className="font-medium text-gray-800 group-hover:text-blue-600">
                          {tag.name}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {tag.count}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No trending tags yet</p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Link 
                  to="/discover"
                  onClick={() => {
                    setSelectedTag('');
                    setSearchQuery('');
                    setSearchParams({});
                    setSelectedCategory('all');
                  }}
                  className="block w-full text-center py-2 text-blue-600 font-medium hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                >
                  View all topics →
                </Link>
              </div>
            </div>

            {/* Quality Guidelines */}
            <div className="bg-green-50 border border-green-100 rounded-xl p-6 mb-6">
              <h3 className="font-bold text-gray-900 text-lg mb-3">✨ Quality Content</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <div className="bg-green-100 text-green-600 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">✓</div>
                  <span>Only questions with engagement are shown</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-green-100 text-green-600 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">✓</div>
                  <span>Sorted by popularity and quality</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-green-100 text-green-600 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">✓</div>
                  <span>New user questions need time to appear here</span>
                </li>
              </ul>
            </div>

            {/* Popular Categories */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-bold text-gray-900 text-lg mb-4">📚 Popular Categories</h3>
              <div className="space-y-3">
                {['Technology', 'Programming', 'Science', 'Career', 'Business'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      // Clear tag if selecting category
                      if (selectedTag) {
                        setSelectedTag('');
                        setSearchParams({});
                        setSearchQuery('');
                      }
                      window.scrollTo(0, 0);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition ${
                      selectedCategory === cat
                        ? 'bg-blue-50 text-blue-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium">{cat}</span>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {getCategoryCount(cat)} questions
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Discover;