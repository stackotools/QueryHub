import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaThumbsUp, 
  FaThumbsDown, 
  FaComment, 
  FaShare, 
  FaBookmark,
  FaCheck,
  FaEdit,
  FaTrash,
  FaFlag,
  FaEye,
  FaClock,
  FaHashtag,
  FaUser,
  FaPaperPlane,
  FaSortAmountDown,
  FaReply,
  FaRegBookmark,
  FaRegThumbsUp,
  FaRegThumbsDown,
  FaSort,
  FaFilter,
  FaCode,
  FaBold,
  FaItalic,
  FaListOl,
  FaListUl,
  FaTimes
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { getQuestion, addAnswer, upvoteQuestion, downvoteQuestion } from '../services/questionService';
import { upvoteAnswer, downvoteAnswer, markBestAnswer } from '../services/answerService';
import API from '../utils/api';

const QuestionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [newAnswer, setNewAnswer] = useState('');
  const [newComment, setNewComment] = useState('');
  const [activeComment, setActiveComment] = useState(null);
  const [sortBy, setSortBy] = useState('votes');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [relatedQuestions, setRelatedQuestions] = useState([]);
  const [showAnswerEditor, setShowAnswerEditor] = useState(false);

  useEffect(() => {
    fetchQuestionData();
    fetchRelatedQuestions();
  }, [id]);

  const fetchQuestionData = async () => {
    try {
      setLoading(true);
      const data = await getQuestion(id);
      setQuestion(data.question);
      setAnswers(data.answers || []);
    } catch (error) {
      console.error('Error fetching question:', error);
      setQuestion(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedQuestions = async () => {
    try {
      if (question?.category) {
        const response = await API.get('/questions', {
          params: { category: question.category, limit: 5 }
        });
        const filtered = response.data.questions.filter(q => q._id !== id);
        setRelatedQuestions(filtered.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching related questions:', error);
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
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleQuestionVote = async (type) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      if (type === 'upvote') {
        await upvoteQuestion(id);
      } else {
        await downvoteQuestion(id);
      }
      await fetchQuestionData(); // Refresh data to get updated vote counts
    } catch (error) {
      console.error('Error voting:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        alert('Failed to vote. Please try again.');
      }
    }
  };

  const handleAnswerVote = async (answerId, type) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      if (type === 'upvote') {
        await upvoteAnswer(answerId);
      } else {
        await downvoteAnswer(answerId);
      }
      await fetchQuestionData(); // Refresh data to get updated vote counts
    } catch (error) {
      console.error('Error voting answer:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        alert('Failed to vote. Please try again.');
      }
    }
  };

  const handleMarkBestAnswer = async (answerId) => {
    if (!user || !question) return;

    // Check if user is question owner
    if (question.author?._id !== user._id) {
      alert('Only the question owner can mark best answers.');
      return;
    }

    try {
      await markBestAnswer(answerId);
      await fetchQuestionData(); // Refresh data to get updated best answer status
    } catch (error) {
      console.error('Error marking best answer:', error);
      if (error.response?.status === 401) {
        alert('Only the question owner can mark best answers.');
      } else {
        alert('Failed to update best answer. Please try again.');
      }
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    if (!newAnswer.trim()) {
      alert('Please write an answer');
      return;
    }

    try {
      setSubmitting(true);
      const result = await addAnswer(id, newAnswer);
      setAnswers([result, ...answers]);
      setNewAnswer('');
      setShowAnswerEditor(false);
      
      // Update question answers count
      setQuestion(prev => ({
        ...prev,
        answersCount: (prev.answersCount || 0) + 1
      }));
      
      alert('Answer posted successfully!');
    } catch (error) {
      console.error('Error posting answer:', error);
      alert('Failed to post answer: ' + (error.message || 'Please try again'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async (answerId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!newComment.trim()) return;

    try {
      const response = await API.post(`/answers/${answerId}/comments`, {
        content: newComment
      });
      
      // Refresh question data to get updated answers with populated comments
      await fetchQuestionData();
      
      setNewComment('');
      setActiveComment(null);
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    }
  };

  const sortedAnswers = [...answers].sort((a, b) => {
    if (sortBy === 'votes') {
      const scoreA = (a.upvotes?.length || 0) - (a.downvotes?.length || 0);
      const scoreB = (b.upvotes?.length || 0) - (b.downvotes?.length || 0);
      return scoreB - scoreA;
    }
    if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    return 0;
  });

  const handleDeleteQuestion = async () => {
    if (!user || !question) return;
    
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await API.delete(`/questions/${id}`);
        alert('Question deleted successfully!');
        navigate('/home');
      } catch (error) {
        console.error('Error deleting question:', error);
        alert('Failed to delete question');
      }
    }
  };

  const handleDeleteAnswer = async (answerId) => {
    if (!user) return;
    
    if (window.confirm('Are you sure you want to delete this answer?')) {
      try {
        await API.delete(`/answers/${answerId}`);
        setAnswers(prev => prev.filter(a => a._id !== answerId));
        alert('Answer deleted successfully!');
      } catch (error) {
        console.error('Error deleting answer:', error);
        alert('Failed to delete answer');
      }
    }
  };

  const handleShareQuestion = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: question?.title,
        text: question?.content?.substring(0, 100),
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading question...</p>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Question not found</h2>
          <p className="text-gray-600 mb-6">The question you're looking for doesn't exist or has been deleted.</p>
          <Link to="/home" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const isQuestionOwner = user && question.author?._id === user._id;
  const questionUpvotes = question.upvotes?.length || 0;
  const questionDownvotes = question.downvotes?.length || 0;
  const questionScore = questionUpvotes - questionDownvotes;

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
            <Link to="/" className="text-xl font-bold text-gray-900">
              QueryHub
            </Link>
            <div className="w-24"></div> {/* Spacer */}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="lg:w-2/3">
            {/* Question */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
              {/* Question Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  {question.author?.avatar ? (
                    <img 
                      src={question.author.avatar} 
                      alt={question.author.name}
                      className="w-12 h-12 rounded-full border"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                      {question.author?.name?.charAt(0) || 'A'}
                    </div>
                  )}
                  <div>
                    <Link to={`/profile/${question.author?._id}`} className="font-semibold text-gray-900 hover:text-blue-600">
                      {question.isAnonymous ? 'Anonymous' : (question.author?.name || 'User')}
                    </Link>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span className="flex items-center">
                        <FaClock className="mr-1" size={12} />
                        {formatTime(question.createdAt)}
                      </span>
                      <span>•</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        {question.category || 'General'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {isQuestionOwner && (
                    <>
                      <button className="p-2 text-gray-400 hover:text-blue-600">
                        <FaEdit />
                      </button>
                      <button 
                        onClick={handleDeleteQuestion}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <FaTrash />
                      </button>
                    </>
                  )}
                  <button className="p-2 text-gray-400 hover:text-yellow-600">
                    <FaFlag />
                  </button>
                </div>
              </div>

              {/* Question Title */}
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {question.title}
              </h1>

              {/* Question Content */}
              <div className="prose max-w-none mb-6">
                <div className="text-gray-700 whitespace-pre-wrap">
                  {question.content}
                </div>
              </div>

              {/* Tags */}
              {question.tags && question.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {question.tags.map((tag, index) => (
                    <Link
                      key={index}
                      to={`/tags/${tag}`}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 flex items-center"
                    >
                      <FaHashtag className="mr-1" size={12} />
                      {tag}
                    </Link>
                  ))}
                </div>
              )}

              {/* Question Stats & Actions */}
              <div className="flex flex-wrap justify-between items-center pt-6 border-t">
                <div className="flex items-center space-x-6 mb-4 md:mb-0">
                  {/* Voting */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleQuestionVote('upvote')}
                      className={`p-2 rounded-lg ${user && question.upvotes?.includes(user._id) ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                      disabled={!user}
                      title={user ? "Upvote" : "Login to upvote"}
                    >
                      {user && question.upvotes?.includes(user._id) ? <FaThumbsUp /> : <FaRegThumbsUp />}
                    </button>
                    <span className="font-semibold text-gray-900">
                      {questionScore}
                    </span>
                    <button
                      onClick={() => handleQuestionVote('downvote')}
                      className={`p-2 rounded-lg ${user && question.downvotes?.includes(user._id) ? 'text-red-600 bg-red-50' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
                      disabled={!user}
                      title={user ? "Downvote" : "Login to downvote"}
                    >
                      {user && question.downvotes?.includes(user._id) ? <FaThumbsDown /> : <FaRegThumbsDown />}
                    </button>
                  </div>

                  {/* Comments */}
                  <div className="flex items-center text-gray-600">
                    <FaComment className="mr-2" />
                    <span>{answers.reduce((sum, ans) => sum + (ans.comments?.length || 0), 0)} comments</span>
                  </div>

                  {/* Views */}
                  <div className="flex items-center text-gray-600">
                    <FaEye className="mr-2" />
                    <span>{question.views?.toLocaleString() || 0} views</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    className={`p-2 ${false ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                    title="Bookmark"
                  >
                    <FaRegBookmark />
                  </button>
                  <button 
                    onClick={handleShareQuestion}
                    className="p-2 text-gray-400 hover:text-gray-600"
                    title="Share"
                  >
                    <FaShare />
                  </button>
                </div>
              </div>
            </div>

            {/* Answers Section */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
                </h2>
                <div className="flex items-center">
                  <FaSortAmountDown className="mr-2 text-gray-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="votes">Highest Votes</option>
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                  </select>
                </div>
              </div>

              {/* Answers List */}
              <div className="space-y-6">
                {sortedAnswers.length > 0 ? (
                  sortedAnswers.map((answer) => {
                    const answerUpvotes = answer.upvotes?.length || 0;
                    const answerDownvotes = answer.downvotes?.length || 0;
                    const answerScore = answerUpvotes - answerDownvotes;
                    const isAnswerOwner = user && answer.author?._id === user._id;

                    return (
                      <div
                        key={answer._id}
                        className={`border rounded-xl p-6 ${answer.isBestAnswer ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                      >
                        {/* Best Answer Badge */}
                        {answer.isBestAnswer && (
                          <div className="flex items-center mb-4 text-green-700">
                            <FaCheck className="mr-2" />
                            <span className="font-semibold">Best Answer</span>
                          </div>
                        )}

                        {/* Answer Header */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center space-x-3">
                            {answer.author?.avatar ? (
                              <img 
                                src={answer.author.avatar} 
                                alt={answer.author.name}
                                className="w-10 h-10 rounded-full border"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                                {answer.author?.name?.charAt(0) || 'A'}
                              </div>
                            )}
                            <div>
                              <Link to={`/profile/${answer.author?._id}`} className="font-semibold text-gray-900">
                                {answer.author?.name || 'User'}
                              </Link>
                              {answer.author?.bio && (
                                <p className="text-sm text-gray-500">{answer.author.bio}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <FaClock className="mr-2" />
                            {formatTime(answer.createdAt)}
                          </div>
                        </div>

                        {/* Answer Content */}
                        <div className="prose max-w-none mb-4">
                          <div className="text-gray-700 whitespace-pre-wrap">
                            {answer.content}
                          </div>
                        </div>

                        {/* Answer Actions */}
                        <div className="flex justify-between items-center pt-4 border-t">
                          <div className="flex items-center space-x-4">
                            {/* Voting */}
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleAnswerVote(answer._id, 'upvote')}
                                className={`p-1 rounded ${user && answer.upvotes?.includes(user._id) ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'}`}
                                disabled={!user}
                              >
                                {user && answer.upvotes?.includes(user._id) ? <FaThumbsUp /> : <FaRegThumbsUp />}
                              </button>
                              <span className="font-medium text-gray-900">
                                {answerScore}
                              </span>
                              <button
                                onClick={() => handleAnswerVote(answer._id, 'downvote')}
                                className={`p-1 rounded ${user && answer.downvotes?.includes(user._id) ? 'text-red-600' : 'text-gray-400 hover:text-red-600'}`}
                                disabled={!user}
                              >
                                {user && answer.downvotes?.includes(user._id) ? <FaThumbsDown /> : <FaRegThumbsDown />}
                              </button>
                            </div>

                            {/* Comments */}
                            <button
                              onClick={() => setActiveComment(activeComment === answer._id ? null : answer._id)}
                              className="flex items-center text-gray-600 hover:text-blue-600"
                            >
                              <FaComment className="mr-2" />
                              <span>{answer.comments?.length || 0}</span>
                            </button>

                            {/* Mark as Best - Show for question owner, toggle functionality */}
                            {isQuestionOwner && (
                              <button
                                onClick={() => handleMarkBestAnswer(answer._id)}
                                className={`${answer.isBestAnswer ? 'text-green-600 bg-green-50' : 'text-gray-600 hover:text-green-600'}`}
                                title={answer.isBestAnswer ? "Unmark as best answer" : "Mark as best answer"}
                              >
                                <FaCheck />
                              </button>
                            )}
                          </div>

                          <div className="flex items-center space-x-3">
                            {isAnswerOwner && (
                              <button 
                                onClick={() => handleDeleteAnswer(answer._id)}
                                className="text-gray-400 hover:text-red-600"
                                title="Delete answer"
                              >
                                <FaTrash />
                              </button>
                            )}
                            <button className="text-gray-400 hover:text-gray-600">
                              <FaFlag />
                            </button>
                          </div>
                        </div>

                        {/* Comments Section */}
                        {activeComment === answer._id && (
                          <div className="mt-6 pt-6 border-t">
                            {/* Existing Comments */}
                            {answer.comments?.map((comment, index) => (
                              <div key={index} className="mb-4 last:mb-0">
                                <div className="flex items-start space-x-3">
                                  {comment.author?.avatar ? (
                                    <img 
                                      src={comment.author.avatar} 
                                      alt={comment.author.name}
                                      className="w-8 h-8 rounded-full border mt-1"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm mt-1">
                                      {comment.author?.name?.charAt(0) || 'U'}
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <div className="flex justify-between">
                                      <span className="font-medium text-gray-900">
                                        {comment.author?.name || comment.author || 'User'}
                                      </span>
                                      <span className="text-sm text-gray-500">{formatTime(comment.createdAt)}</span>
                                    </div>
                                    <p className="text-gray-700 mt-1">{comment.content}</p>
                                  </div>
                                </div>
                              </div>
                            ))}

                            {/* Add Comment Form */}
                            <div className="mt-4 flex space-x-2">
                              <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                onKeyPress={(e) => e.key === 'Enter' && handleAddComment(answer._id)}
                              />
                              <button
                                onClick={() => handleAddComment(answer._id)}
                                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                disabled={!newComment.trim()}
                              >
                                <FaReply />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <FaComment className="text-4xl text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No answers yet</h3>
                    <p className="text-gray-500">Be the first to answer this question!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Your Answer Form */}
            {user ? (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Your Answer</h2>
                  <button
                    onClick={() => setShowAnswerEditor(!showAnswerEditor)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {showAnswerEditor ? 'Cancel' : 'Write Answer'}
                  </button>
                </div>
                
                {showAnswerEditor && (
                  <form onSubmit={handleSubmitAnswer}>
                    <textarea
                      value={newAnswer}
                      onChange={(e) => setNewAnswer(e.target.value)}
                      placeholder="Write your answer here. Be detailed and provide examples if possible."
                      rows={8}
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none mb-4"
                      disabled={submitting}
                    />
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500">
                        Use markdown for formatting. Be respectful and helpful.
                      </p>
                      <button
                        type="submit"
                        disabled={submitting || !newAnswer.trim()}
                        className={`flex items-center px-6 py-3 rounded-lg font-medium ${submitting || !newAnswer.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                      >
                        {submitting ? (
                          <>
                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Posting...
                          </>
                        ) : (
                          <>
                            <FaPaperPlane className="mr-2" />
                            Post Your Answer
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
                
                {!showAnswerEditor && (
                  <button
                    onClick={() => setShowAnswerEditor(true)}
                    className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-800 hover:border-gray-400 transition"
                  >
                    <FaPaperPlane className="inline mr-2" />
                    Click here to write your answer
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Want to answer this question?</h3>
                <p className="text-gray-600 mb-6">Please login to post an answer.</p>
                <Link to="/login" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Login to Answer
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/3">
            {/* Related Questions */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-6 sticky top-24">
              <h3 className="font-bold text-gray-900 text-lg mb-4">Related Questions</h3>
              <div className="space-y-4">
                {relatedQuestions.length > 0 ? (
                  relatedQuestions.map((q) => (
                    <Link
                      key={q._id}
                      to={`/question/${q._id}`}
                      className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 group"
                    >
                      <h4 className="font-medium text-gray-900 group-hover:text-blue-600 mb-1 line-clamp-2">
                        {q.title}
                      </h4>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{q.answersCount || 0} answers</span>
                        <span>{(q.upvotes?.length || 0) - (q.downvotes?.length || 0)} votes</span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No related questions found</p>
                )}
              </div>
              <Link
                to="/questions"
                className="block mt-4 text-center text-blue-600 font-medium hover:text-blue-800"
              >
                View all questions →
              </Link>
            </div>

            {/* Question Stats */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
              <h3 className="font-bold text-gray-900 text-lg mb-4">Question Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Asked</span>
                  <span className="font-medium">{formatTime(question.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Views</span>
                  <span className="font-medium">{question.views?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Answers</span>
                  <span className="font-medium">{answers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Votes</span>
                  <span className="font-medium">{questionScore}</span>
                </div>
                {question.isAnswered && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Answered</span>
                    <span className="font-medium text-green-600">✓</span>
                  </div>
                )}
              </div>
            </div>

            {/* Community Guidelines */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 text-lg mb-3">💡 Answering Guidelines</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">✓</div>
                  <span>Be respectful and professional</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">✓</div>
                  <span>Provide evidence or examples</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt=0.5 flex-shrink-0">✓</div>
                  <span>Cite sources when possible</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">✓</div>
                  <span>Focus on being helpful, not just right</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionDetail;