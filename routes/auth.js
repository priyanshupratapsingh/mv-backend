const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.js");
const authenticate = require("./authMiddleware"); // Import the middleware

const router = express.Router();
const JWT_SECRET = 'your_secret_key';

// Public Routes (no authentication needed)

// Login Route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Register Route
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: 'Username already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Protected Routes (require authentication)
// Add the authenticate middleware before the route handler

// Example protected route - Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    // req.user contains the decoded JWT (from authMiddleware)
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Another protected route example - Update user
router.put('/profile', authenticate, async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: req.body },
      { new: true }
    ).select('-password');
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/bookmark', authenticate, async (req, res) => {
  try {
    const { movieId, title, posterPath } = req.body;
    const user = await User.findById(req.user.userId);
    
    // Check if already bookmarked
    const alreadyBookmarked = user.bookmarks.some(b => b.movieId.toString() === movieId.toString());
    if (alreadyBookmarked) {
      return res.status(400).json({ message: 'Movie already in your list' });
    }

    user.bookmarks.push({ movieId, title, posterPath });
    await user.save();
    
    res.json({ message: 'Added to your list', bookmarks: user.bookmarks });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/my-list', authenticate, async (req, res) => {
  try {
    // Find user and populate just the bookmarks data
    const user = await User.findById(req.user.userId).select('bookmarks');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.bookmarks);
  } catch (err) {
    console.error('Error fetching user list:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/check-bookmark/:movieId', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const isBookmarked = user.bookmarks.some(
      b => b.movieId === req.params.movieId
    );
    res.json({ isBookmarked });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
module.exports = router;