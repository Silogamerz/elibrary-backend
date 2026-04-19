const cors = require('cors');

app.use(cors({
  origin: 'https://elibrary-frontend.vercel.app',
  credentials: true
}));
// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path'); // only once at the top

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===================
// MongoDB Models
// ===================
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
});

const bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  description: String,
});

const User = mongoose.model('User', userSchema);
const Book = mongoose.model('Book', bookSchema);

// ===================
// Connect to MongoDB
// ===================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ===================
// JWT Middleware
// ===================
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// ===================
// Auth Routes
// ===================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ success: true, user: { name, email }, token });
  } catch (err) {
    res.status(400).json({ success: false, message: 'User already exists or invalid data' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid password' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ success: true, user: { name: user.name, email }, token });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get profile
app.get('/api/auth/profile', authMiddleware, async (req, res) => {
  const user = await User.findById(req.userId).select('-password');
  res.json({ success: true, user });
});

// ===================
// Book Routes
// ===================

// Get all books
app.get('/api/books', async (req, res) => {
  const books = await Book.find();
  res.json({ success: true, books });
});

// Get single book
app.get('/api/books/:id', async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
  res.json({ success: true, book });
});

// Create book (protected)
app.post('/api/books', authMiddleware, async (req, res) => {
  const book = new Book(req.body);
  await book.save();
  res.json({ success: true, book });
});

// ===================
// Serve React Frontend
// ===================
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');

  app.use(express.static(frontendPath));

  // Catch-all route using RegExp (fixed for Express 5 / path-to-regexp)
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// ===================
// Start Server
// ===================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));