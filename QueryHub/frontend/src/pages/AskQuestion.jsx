import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaHashtag, 
  FaTag, 
  FaEye, 
  FaCode, 
  FaBold, 
  FaItalic, 
  FaListOl, 
  FaListUl,
  FaPaperPlane,
  FaTimes
} from 'react-icons/fa';
import { createQuestion } from '../services/questionService';
import { useAuth } from '../context/AuthContext';

const AskQuestion = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: [],
    isAnonymous: false
  });
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState({});
  const [previewMode, setPreviewMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available categories
  const categories = [
    'Technology',
    'Programming',
    'Science',
    'Mathematics',
    'Business',
    'Career',
    'Education',
    'Health',
    'Lifestyle',
    'Arts & Culture',
    'Sports',
    'Other'
  ];

  // Popular tags
  const popularTags = [
    'react', 'javascript', 'python', 'web-development',
    'artificial-intelligence', 'machine-learning', 'data-science',
    'career-advice', 'startup', 'programming', 'algorithms',
    'database', 'cloud-computing', 'cybersecurity', 'mobile-apps'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddTag = (tag) => {
    if (formData.tags.length >= 5) {
      setErrors(prev => ({ ...prev, tags: 'Maximum 5 tags allowed' }));
      return;
    }
    if (!formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
    setTagInput('');
    if (errors.tags) setErrors(prev => ({ ...prev, tags: '' }));
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagInput.trim()) {
        handleAddTag(tagInput.trim().toLowerCase());
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 15) {
      newErrors.title = 'Title should be at least 15 characters';
    } else if (formData.title.trim().length > 150) {
      newErrors.title = 'Title should not exceed 150 characters';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Question content is required';
    } else if (formData.content.trim().length < 30) {
      newErrors.content = 'Please provide more details (at least 30 characters)';
    }
    
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }
    
    if (formData.tags.length === 0) {
      newErrors.tags = 'Please add at least one tag';
    } else if (formData.tags.length > 5) {
      newErrors.tags = 'Maximum 5 tags allowed';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    
    if (Object.keys(validationErrors).length === 0) {
      if (!user) {
        alert('Please login to ask a question');
        navigate('/login');
        return;
      }

      try {
        setIsSubmitting(true);
        
        // Prepare question data
        const questionData = {
          title: formData.title,
          content: formData.content,
          category: formData.category,
          tags: formData.tags,
          isAnonymous: formData.isAnonymous
        };
        
        // Call API to create question
        console.log('Submitting question:', questionData);
        const response = await createQuestion(questionData);
        console.log('Question created successfully:', response);
        
        alert('Question posted successfully!');
        navigate('/home');
        
      } catch (error) {
        console.error('Error creating question:', error);
        alert('Failed to post question: ' + (error.response?.data?.message || 'Please try again'));
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setErrors(validationErrors);
    }
  };

  const formatText = (command) => {
    const textarea = document.getElementById('content');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    let newText = formData.content;
    
    switch (command) {
      case 'bold':
        newText = formData.content.substring(0, start) + 
                 '**' + selectedText + '**' + 
                 formData.content.substring(end);
        break;
      case 'italic':
        newText = formData.content.substring(0, start) + 
                 '*' + selectedText + '*' + 
                 formData.content.substring(end);
        break;
      case 'code':
        newText = formData.content.substring(0, start) + 
                 '`' + selectedText + '`' + 
                 formData.content.substring(end);
        break;
      case 'list-ol':
        newText = formData.content.substring(0, start) + 
                 '1. ' + selectedText + '\n' + 
                 formData.content.substring(end);
        break;
      case 'list-ul':
        newText = formData.content.substring(0, start) + 
                 '- ' + selectedText + '\n' + 
                 formData.content.substring(end);
        break;
      default:
        break;
    }
    
    setFormData(prev => ({ ...prev, content: newText }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/home" className="flex items-center text-gray-600 hover:text-gray-900">
              <FaArrowLeft className="mr-2" />
              Back to Home
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Ask a Question</h1>
            <div className="w-20"></div> {/* Spacer for alignment */}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Title Input */}
            <div className="mb-8">
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                What's your question?
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Be specific and imagine you're asking another person"
                className={`w-full p-4 text-lg border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                maxLength={150}
                disabled={isSubmitting}
              />
              <div className="flex justify-between mt-2">
                {errors.title ? (
                  <p className="text-red-600 text-sm">{errors.title}</p>
                ) : (
                  <p className="text-gray-500 text-sm">
                    Try to be clear and concise. Good questions get better answers.
                  </p>
                )}
                <span className="text-gray-500 text-sm">
                  {formData.title.length}/150
                </span>
              </div>
            </div>

            {/* Content Editor */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-lg font-semibold text-gray-900">
                  Add details
                </label>
                <button
                  type="button"
                  onClick={() => setPreviewMode(!previewMode)}
                  className="flex items-center text-blue-600 hover:text-blue-800"
                  disabled={isSubmitting}
                >
                  <FaEye className="mr-2" />
                  {previewMode ? 'Edit' : 'Preview'}
                </button>
              </div>

              {!previewMode ? (
                <>
                  {/* Formatting Toolbar */}
                  <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => formatText('bold')}
                      className="p-2 hover:bg-gray-200 rounded"
                      title="Bold"
                      disabled={isSubmitting}
                    >
                      <FaBold />
                    </button>
                    <button
                      type="button"
                      onClick={() => formatText('italic')}
                      className="p-2 hover:bg-gray-200 rounded"
                      title="Italic"
                      disabled={isSubmitting}
                    >
                      <FaItalic />
                    </button>
                    <button
                      type="button"
                      onClick={() => formatText('code')}
                      className="p-2 hover:bg-gray-200 rounded"
                      title="Code"
                      disabled={isSubmitting}
                    >
                      <FaCode />
                    </button>
                    <div className="w-px h-6 bg-gray-300 mx-1"></div>
                    <button
                      type="button"
                      onClick={() => formatText('list-ol')}
                      className="p-2 hover:bg-gray-200 rounded"
                      title="Numbered List"
                      disabled={isSubmitting}
                    >
                      <FaListOl />
                    </button>
                    <button
                      type="button"
                      onClick={() => formatText('list-ul')}
                      className="p-2 hover:bg-gray-200 rounded"
                      title="Bulleted List"
                      disabled={isSubmitting}
                    >
                      <FaListUl />
                    </button>
                  </div>

                  {/* Content Textarea */}
                  <textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    placeholder="Include all the information someone would need to answer your question. You can use markdown for formatting."
                    rows={10}
                    className={`w-full p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                      errors.content ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isSubmitting}
                  />
                </>
              ) : (
                // Preview
                <div className="p-4 border border-gray-300 rounded-lg bg-gray-50 min-h-[200px]">
                  <div className="prose max-w-none">
                    <h2 className="text-xl font-bold mb-4">{formData.title}</h2>
                    <div className="whitespace-pre-wrap">
                      {formData.content || <p className="text-gray-500 italic">Preview will appear here...</p>}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-2">
                {errors.content ? (
                  <p className="text-red-600 text-sm">{errors.content}</p>
                ) : (
                  <p className="text-gray-500 text-sm">
                    Include code snippets, error messages, or any relevant details.
                  </p>
                )}
              </div>
            </div>

            {/* Category Selection */}
            <div className="mb-8">
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                Category
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                    className={`p-3 border rounded-lg text-center transition ${
                      formData.category === cat
                        ? 'bg-blue-50 border-blue-500 text-blue-600'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isSubmitting}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {errors.category && (
                <p className="mt-2 text-red-600 text-sm">{errors.category}</p>
              )}
            </div>

            {/* Tags Input */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-lg font-semibold text-gray-900">
                  Tags
                </label>
                <span className="text-sm text-gray-500">
                  {formData.tags.length}/5 tags
                </span>
              </div>
              
              {/* Selected Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    <FaHashtag className="mr-1" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-blue-700 hover:text-blue-900"
                      disabled={isSubmitting}
                    >
                      <FaTimes size={12} />
                    </button>
                  </span>
                ))}
              </div>

              {/* Tag Input */}
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaTag className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="Add tags (press Enter or comma to add)"
                  className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => tagInput.trim() && handleAddTag(tagInput.trim().toLowerCase())}
                  className="absolute right-2 top-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  Add
                </button>
              </div>

              {/* Popular Tags */}
              <div>
                <p className="text-gray-600 mb-2">Popular tags:</p>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddTag(tag)}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
                      disabled={isSubmitting}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
              
              {errors.tags && (
                <p className="mt-2 text-red-600 text-sm">{errors.tags}</p>
              )}
            </div>

            {/* Anonymous Option */}
            <div className="mb-8 flex items-center">
              <input
                type="checkbox"
                id="isAnonymous"
                name="isAnonymous"
                checked={formData.isAnonymous}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={isSubmitting}
              />
              <label htmlFor="isAnonymous" className="ml-2 text-gray-700">
                Ask anonymously (your name won't be shown)
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Link
                to="/home"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex items-center px-8 py-3 rounded-lg font-medium transition ${
                  isSubmitting ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                {isSubmitting ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Posting...
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="mr-2" />
                    Post Question
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Tips */}
          <div className="mt-12 p-6 bg-blue-50 rounded-xl">
            <h3 className="font-bold text-gray-900 text-lg mb-3">💡 Tips for getting good answers</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <div className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">1</div>
                <span>Be specific and provide enough context</span>
              </li>
              <li className="flex items-start">
                <div className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">2</div>
                <span>Check for existing questions before posting</span>
              </li>
              <li className="flex items-start">
                <div className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">3</div>
                <span>Use proper formatting for code and quotes</span>
              </li>
              <li className="flex items-start">
                <div className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">4</div>
                <span>Choose relevant tags to reach the right audience</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AskQuestion;