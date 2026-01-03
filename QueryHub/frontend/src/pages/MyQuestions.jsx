// frontend/src/pages/MyQuestions.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaQuestionCircle, 
  FaPen, 
  FaThumbsUp, 
  FaComment, 
  FaEye, 
  FaClock,
  FaHashtag,
  FaSearch,
  FaFilter,
  FaTrash,
  FaEdit,
  FaPlus
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

const MyQuestions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuestions: 0,
    totalAnswers: 0,
    totalViews: 0,
    totalUpvotes: 0,
    avgAnswers: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchMyQuestions();
    }
  }, [user, activeFilter]);

  const fetchMyQuestions = async () => {
    try {
      setLoading(true);
      console.log('Fetching questions for user:', user._id);
      
      const response = await API.get(`/questions/user/${user._id}`);
      
      console.log('My questions response:', response.data);
      
      let questionsData = [];
      if (Array.isArray(response.data)) {
        questionsData = response.data;
      } else if (response.data && response.data.questions) {
        questionsData = response.data.questions;
      }
      
      // Apply filters
      let filteredQuestions = questionsData;
      
      // Apply search filter
      if (searchQuery.trim()) {
        filteredQuestions = filteredQuestions.filter(q =>
          q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
      
      // Apply status filter
      if (activeFilter === 'answered') {
        filteredQuestions = filteredQuestions.filter(q => (q.answersCount || 0) > 0);
      } else if (activeFilter === 'unanswered') {
        filteredQuestions = filteredQuestions.filter(q => (q.answersCount || 0) === 0);
      } else if (activeFilter === 'popular') {
        filteredQuestions = filteredQuestions.filter(q => 
          ((q.upvotes?.length || 0) - (q.downvotes?.length || 0)) > 0
        );
        filteredQuestions.sort((a, b) => {
          const aScore = (a.upvotes?.length || 0) - (a.downvotes?.length || 0);
          const bScore = (b.upvotes?.length || 0) - (b.downvotes?.length || 0);
          return bScore - aScore;
        });
      } else if (activeFilter === 'recent') {
        filteredQuestions.sort((a, b) => 
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
      }
      
      setQuestions(filteredQuestions);
      calculateStats(filteredQuestions);
      
    } catch (error) {
      console.error('Error fetching my questions:', error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (questionsList) => {
    const totalQuestions = questionsList.length;
    const totalAnswers = questionsList.reduce((sum, q) => sum + (q.answersCount || 0), 0);
    const totalViews = questionsList.reduce((sum, q) => sum + (q.views || 0), 0);
    const totalUpvotes = questionsList.reduce((sum, q) => sum + (q.upvotes?.length || 0), 0);
    const avgAnswers = totalQuestions > 0 ? (totalAnswers / totalQuestions).toFixed(1) : 0;
    
    setStats({
      totalQuestions,
      totalAnswers,
      totalViews,
      totalUpvotes,
      avgAnswers
    });
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
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMyQuestions();
  };

  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await API.delete(`/questions/${questionId}`);
        alert('Question deleted successfully!');
        fetchMyQuestions(); // Refresh list
      } catch (error) {
        console.error('Error deleting question:', error);
        alert('Failed to delete question');
      }
    }
  };

  const getAnswerStatus = (answersCount) => {
    if (answersCount === 0) {
      return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Unanswered</span>;
    } else if (answersCount === 1) {
      return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">{answersCount} answer</span>;
    } else {
      return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">{answersCount} answers</span>;
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please login to view your questions</h2>
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
            <h1 className="text-2xl font-bold text-gray-900">My Questions</h1>
            <div className="text-gray-600">{questions.length} questions</div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Banner */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Your Questions Dashboard</h2>
              <p className="opacity-90">Track all your questions and their performance</p>
            </div>
            <div className="text-4xl">
              <FaQuestionCircle />
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.totalQuestions}</div>
              <div className="text-sm opacity-80">Total Questions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.totalAnswers}</div>
              <div className="text-sm opacity-80">Total Answers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{formatNumber(stats.totalViews)}</div>
              <div className="text-sm opacity-80">Total Views</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{formatNumber(stats.totalUpvotes)}</div>
              <div className="text-sm opacity-80">Total Upvotes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.avgAnswers}</div>
              <div className="text-sm opacity-80">Avg Answers</div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search in your questions..."
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

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium ${activeFilter === 'all' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                All Questions
              </button>
              <button
                onClick={() => setActiveFilter('answered')}
                className={`px-4 py-2 rounded-lg font-medium ${activeFilter === 'answered' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Answered
              </button>
              <button
                onClick={() => setActiveFilter('unanswered')}
                className={`px-4 py-2 rounded-lg font-medium ${activeFilter === 'unanswered' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Unanswered
              </button>
              <button
                onClick={() => setActiveFilter('popular')}
                className={`px-4 py-2 rounded-lg font-medium ${activeFilter === 'popular' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Most Popular
              </button>
            </div>

            {/* Ask Question Button */}
            <Link
              to="/ask"
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center"
            >
              <FaPlus className="mr-2" />
              Ask New Question
            </Link>
          </div>
        </div>

        {/* Questions List */}
        <div className="bg-white rounded-xl shadow-sm border">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading your questions...</p>
            </div>
          ) : questions.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {questions.map((question) => (
                <div key={question._id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {/* Question Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {question.category || 'General'}
                          </span>
                          {getAnswerStatus(question.answersCount || 0)}
                          {(question.answersCount || 0) > 0 && question.isAnswered && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                              ✓ Best Answer Selected
                            </span>
                          )}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <FaClock className="mr-1" size={12} />
                          {formatTime(question.createdAt)}
                        </div>
                      </div>

                      {/* Question Title */}
                      <Link to={`/question/${question._id}`}>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600">
                          {question.title}
                        </h3>
                      </Link>

                      {/* Question Preview */}
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {question.content}
                      </p>

                      {/* Tags */}
                      {question.tags && question.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {question.tags.map((tag, index) => (
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

                      {/* Question Stats */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <FaThumbsUp className="mr-2" />
                            <span className="font-medium">
                              {(question.upvotes?.length || 0) - (question.downvotes?.length || 0)} votes
                            </span>
                          </div>
                          <div className="flex items-center">
                            <FaComment className="mr-2" />
                            <span>{question.answersCount || 0} answers</span>
                          </div>
                          <div className="flex items-center">
                            <FaEye className="mr-2" />
                            <span>{formatNumber(question.views || 0)} views</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/question/${question._id}`}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                          >
                            View Details
                          </Link>
                          <button
                            onClick={() => handleDeleteQuestion(question._id)}
                            className="px-3 py-1 border border-red-600 text-red-600 text-sm rounded-lg hover:bg-red-50"
                            title="Delete question"
                          >
                            <FaTrash />
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
              <FaQuestionCircle className="text-4xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {searchQuery ? 'No matching questions found' : 'You haven\'t asked any questions yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery 
                  ? 'Try adjusting your search or clear the search box'
                  : 'Start by asking your first question to get help from the community!'}
              </p>
              <Link
                to="/ask"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                <FaPen className="mr-2" />
                Ask Your First Question
              </Link>
            </div>
          )}
        </div>

        {/* Tips Section */}
        {questions.length > 0 && (
          <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-100">
            <h3 className="font-bold text-gray-900 text-lg mb-3">💡 Tips for Better Engagement</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-lg border">
                <h4 className="font-semibold text-gray-900 mb-2">Get More Answers</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Be specific and clear</li>
                  <li>• Add relevant tags</li>
                  <li>• Include examples if possible</li>
                </ul>
              </div>
              <div className="p-4 bg-white rounded-lg border">
                <h4 className="font-semibold text-gray-900 mb-2">Increase Visibility</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Post during active hours</li>
                  <li>• Share on social media</li>
                  <li>• Engage with commenters</li>
                </ul>
              </div>
              <div className="p-4 bg-white rounded-lg border">
                <h4 className="font-semibold text-gray-900 mb-2">Best Practices</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Mark best answers</li>
                  <li>• Thank helpful users</li>
                  <li>• Update questions with solutions</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyQuestions;