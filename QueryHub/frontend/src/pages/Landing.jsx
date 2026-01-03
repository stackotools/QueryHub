import React from 'react';
import { Link } from 'react-router-dom';
import { FaQuestionCircle, FaUsers, FaLightbulb, FaArrowRight } from 'react-icons/fa';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header/Navigation */}
      <header className="px-6 py-4 flex justify-between items-center border-b">
        <div className="flex items-center space-x-2">
          <FaQuestionCircle className="text-3xl text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">QueryHub</h1>
        </div>
        <div className="flex space-x-4">
          <Link 
            to="/login" 
            className="px-4 py-2 text-blue-600 font-medium hover:text-blue-800 transition"
          >
            Log in
          </Link>
          <Link 
            to="/signup" 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Sign up
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Ask <span className="text-blue-600">Anything</span>, 
            Know <span className="text-blue-600">Everything</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Join millions of curious minds on QueryHub. Ask questions, share knowledge, 
            and discover answers from experts in every field.
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              to="/signup" 
              className="px-8 py-3 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 transition flex items-center"
            >
              Get Started Free
              <FaArrowRight className="ml-2" />
            </Link>
            <Link 
              to="/questions" 
              className="px-8 py-3 border border-blue-600 text-blue-600 text-lg font-medium rounded-lg hover:bg-blue-50 transition"
            >
              Browse Questions
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-md border text-center">
            <div className="flex justify-center mb-4">
              <FaQuestionCircle className="text-4xl text-blue-500" />
            </div>
            <h3 className="text-xl font-bold mb-3">Ask Questions</h3>
            <p className="text-gray-600">
              Post your questions and get answers from knowledgeable people around the world.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-md border text-center">
            <div className="flex justify-center mb-4">
              <FaUsers className="text-4xl text-green-500" />
            </div>
            <h3 className="text-xl font-bold mb-3">Share Knowledge</h3>
            <p className="text-gray-600">
              Help others by answering questions in your areas of expertise.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-md border text-center">
            <div className="flex justify-center mb-4">
              <FaLightbulb className="text-4xl text-yellow-500" />
            </div>
            <h3 className="text-xl font-bold mb-3">Discover Insights</h3>
            <p className="text-gray-600">
              Explore questions and answers on countless topics that interest you.
            </p>
          </div>
        </div>

        {/* Sample Questions Preview */}
        <div className="bg-white rounded-xl shadow-lg border p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Recently Asked Questions</h2>
          <div className="space-y-6">
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <h4 className="font-semibold text-lg">How do I start learning web development in 2024?</h4>
              <p className="text-gray-600">12 answers • 45 upvotes</p>
            </div>
            <div className="border-l-4 border-green-500 pl-4 py-2">
              <h4 className="font-semibold text-lg">What are the best practices for React state management?</h4>
              <p className="text-gray-600">8 answers • 32 upvotes</p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <h4 className="font-semibold text-lg">How does artificial intelligence impact daily life?</h4>
              <p className="text-gray-600">24 answers • 89 upvotes</p>
            </div>
          </div>
          <div className="text-center mt-8">
            <Link to="/questions" className="text-blue-600 font-medium hover:text-blue-800">
              View all questions →
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <FaQuestionCircle className="text-2xl" />
                <span className="text-xl font-bold">QueryHub</span>
              </div>
              <p className="text-gray-400">The knowledge sharing platform</p>
            </div>
            <div className="text-gray-400">
              <p>© 2024 QueryHub. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;