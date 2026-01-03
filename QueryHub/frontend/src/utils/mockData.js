export const mockQuestions = [
  {
    id: 1,
    title: "How do I start learning web development in 2024?",
    content: "I'm completely new to programming and want to become a web developer. What should I learn first? Should I focus on frontend or backend?",
    author: {
      id: 101,
      name: "Alex Johnson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
      expertise: ["Web Development", "JavaScript"]
    },
    category: "Technology",
    tags: ["web-development", "beginners", "programming"],
    upvotes: 124,
    answers: 12,
    views: 2450,
    timestamp: "2024-12-25T10:30:00Z",
    isUpvoted: false,
    isBookmarked: false
  },
  {
    id: 2,
    title: "What are the best practices for React state management?",
    content: "I've been using React for a while but I'm confused about state management. When should I use Context API vs Redux vs Zustand?",
    author: {
      id: 102,
      name: "Sarah Chen",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      expertise: ["React", "Frontend"]
    },
    category: "Programming",
    tags: ["react", "state-management", "frontend"],
    upvotes: 89,
    answers: 8,
    views: 1870,
    timestamp: "2024-12-24T14:20:00Z",
    isUpvoted: true,
    isBookmarked: true
  },
  {
    id: 3,
    title: "How does artificial intelligence impact daily life?",
    content: "From smartphones to smart homes, AI seems to be everywhere. What are some practical examples of AI in our daily routines?",
    author: {
      id: 103,
      name: "Dr. Michael Torres",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
      expertise: ["AI", "Machine Learning"]
    },
    category: "Science",
    tags: ["artificial-intelligence", "technology", "future"],
    upvotes: 210,
    answers: 24,
    views: 5320,
    timestamp: "2024-12-23T09:15:00Z",
    isUpvoted: false,
    isBookmarked: false
  },
  {
    id: 4,
    title: "What are the key differences between Python and JavaScript?",
    content: "I know both are popular but have different use cases. When should I choose Python over JavaScript for a project?",
    author: {
      id: 104,
      name: "David Park",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
      expertise: ["Python", "JavaScript", "Backend"]
    },
    category: "Programming",
    tags: ["python", "javascript", "comparison"],
    upvotes: 76,
    answers: 15,
    views: 3210,
    timestamp: "2024-12-22T16:45:00Z",
    isUpvoted: false,
    isBookmarked: true
  },
  {
    id: 5,
    title: "How to maintain work-life balance as a software developer?",
    content: "Working remotely has blurred the lines between work and personal life. What strategies do experienced developers use?",
    author: {
      id: 105,
      name: "Lisa Wong",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa",
      expertise: ["Career", "Productivity"]
    },
    category: "Career",
    tags: ["work-life-balance", "productivity", "career"],
    upvotes: 142,
    answers: 18,
    views: 4120,
    timestamp: "2024-12-21T11:20:00Z",
    isUpvoted: true,
    isBookmarked: false
  }
];

export const trendingTopics = [
  { name: "Artificial Intelligence", count: 1240 },
  { name: "Web Development", count: 980 },
  { name: "Career Advice", count: 760 },
  { name: "React", count: 650 },
  { name: "Python", count: 540 },
  { name: "Startups", count: 430 },
  { name: "Data Science", count: 390 },
  { name: "Remote Work", count: 320 }
];

export const userProfile = {
  id: 1001,
  name: "Awais Ahmed",
  email: "awais@example.com",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Awais",
  bio: "Full Stack Developer | React Enthusiast | Tech Blogger",
  followers: 245,
  following: 189,
  questionsAsked: 12,
  answersGiven: 47,
  upvotesReceived: 1240,
  joined: "2024-01-15"
};