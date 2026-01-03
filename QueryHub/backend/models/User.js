const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  username: {
    type: String,
    unique: true
  },
  avatar: {
    type: String,
    default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
  },
  bio: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  twitter: {
    type: String,
    default: ''
  },
  github: {
    type: String,
    default: ''
  },
  linkedin: {
    type: String,
    default: ''
  },
  questionsCount: {
    type: Number,
    default: 0
  },
  answersCount: {
    type: Number,
    default: 0
  },
  upvotesReceived: {
    type: Number,
    default: 0
  },
  followers: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    default: []
  },
  following: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    default: []
  },
  // NEW: Bookmarks field
  bookmarks: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    }],
    default: []
  },
  // NEW: For notifications count
  unreadNotifications: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// SIMPLE: Generate username before save
// Using async function instead of callback to avoid "next is not a function" error
userSchema.pre('save', async function() {
  if (!this.username && this.email) {
    // Generate unique username with timestamp to avoid collisions
    const baseUsername = this.email.split('@')[0];
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    this.username = `${baseUsername}${timestamp}${random}`;
  }
});

// SIMPLE: Password check
userSchema.methods.matchPassword = function(enteredPassword) {
  return this.password === enteredPassword;
};

// Follow/Unfollow methods (defined before model export to avoid reference issues)
userSchema.methods.follow = async function(userId) {
  const User = mongoose.model('User');
  // Use string comparison for ObjectId
  const following = Array.isArray(this.following) ? this.following : [];
  const isFollowing = following.some(
    id => id.toString() === userId.toString()
  );
  
  if (!isFollowing) {
    this.following.push(userId);
    await this.save();
    
    // Add follower to the other user using atomic operation
    await User.findByIdAndUpdate(userId, {
      $addToSet: { followers: this._id }
    });
  }
};

userSchema.methods.unfollow = async function(userId) {
  const User = mongoose.model('User');
  // Use string comparison for ObjectId
  const following = Array.isArray(this.following) ? this.following : [];
  const isFollowing = following.some(
    id => id.toString() === userId.toString()
  );
  
  if (isFollowing) {
    this.following.pull(userId);
    await this.save();
    
    // Remove follower from the other user using atomic operation
    await User.findByIdAndUpdate(userId, {
      $pull: { followers: this._id }
    });
  }
};

userSchema.methods.isFollowing = function(userId) {
  // Use string comparison for ObjectId
  const following = Array.isArray(this.following) ? this.following : [];
  return following.some(
    id => id.toString() === userId.toString()
  );
};

module.exports = mongoose.model('User', userSchema);