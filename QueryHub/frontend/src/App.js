// frontend/src/App.js - Complete with Discover and MyQuestions pages
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Discover from './pages/Discover';
import MyQuestions from './pages/MyQuestions';
import AskQuestion from './pages/AskQuestion';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import QuestionDetail from './pages/QuestionDetail';
import Bookmarks from './pages/Bookmarks';
import ExploreUsers from './pages/ExploreUsers';
import Followers from './pages/Followers';
import Following from './pages/Following';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import './App.css';

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/home" />} />
          <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/home" />} />
          
          {/* Protected Routes - MAIN PAGES */}
          <Route path="/home" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/discover" element={
            <ProtectedRoute>
              <Discover />
            </ProtectedRoute>
          } />
          <Route path="/my-questions" element={
            <ProtectedRoute>
              <MyQuestions />
            </ProtectedRoute>
          } />
          <Route path="/ask" element={
            <ProtectedRoute>
              <AskQuestion />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/profile/:id" element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          } />
          <Route path="/question/:id" element={
            <ProtectedRoute>
              <QuestionDetail />
            </ProtectedRoute>
          } />
          
          {/* FOLLOW SYSTEM PAGES */}
          <Route path="/users" element={
            <ProtectedRoute>
              <ExploreUsers />
            </ProtectedRoute>
          } />
          <Route path="/profile/:userId/followers" element={
            <ProtectedRoute>
              <Followers />
            </ProtectedRoute>
          } />
          <Route path="/profile/:userId/following" element={
            <ProtectedRoute>
              <Following />
            </ProtectedRoute>
          } />
          
          {/* OTHER FEATURES */}
          <Route path="/bookmarks" element={
            <ProtectedRoute>
              <Bookmarks />
            </ProtectedRoute>
          } />
          
          {/* 404 - Page Not Found */}
          <Route path="*" element={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center p-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
                <p className="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
                <div className="space-x-4">
                  <button 
                    onClick={() => window.location.href = '/'}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Go Home
                  </button>
                  <button 
                    onClick={() => window.location.href = '/home'}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Dashboard
                  </button>
                </div>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;