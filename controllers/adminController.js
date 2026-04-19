const Book = require('../models/Book');
const User = require('../models/User');
const Order = require('../models/Order');

// Create new book
exports.createBook = async (req, res) => {
  try {
    const { title, author, description, category, isbn, price, rentPrice, coverImage, pages, language, publishedDate } = req.body;

    // Validate required fields
    if (!title || !author || !category || !price) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }

    // Check if book already exists
    if (isbn) {
      const existingBook = await Book.findOne({ isbn });
      if (existingBook) {
        return res.status(400).json({ success: false, message: 'Book with this ISBN already exists' });
      }
    }

    // Create new book
    const book = new Book({
      title,
      author,
      description,
      category,
      isbn,
      price,
      rentPrice: rentPrice || 0,
      coverImage: coverImage || 'https://via.placeholder.com/150x220',
      pages: pages || 0,
      language: language || 'English',
      publishedDate
    });

    await book.save();

    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      book
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update book
exports.updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const book = await Book.findByIdAndUpdate(id, updates, { new: true });

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    res.json({
      success: true,
      message: 'Book updated successfully',
      book
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete book
exports.deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await Book.findByIdAndDelete(id);

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    res.json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort('-createdAt');

    const total = await User.countDocuments();

    res.json({
      success: true,
      users,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('books.book')
      .skip(skip)
      .limit(parseInt(limit))
      .sort('-createdAt');

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get dashboard stats
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBooks = await Book.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort('-createdAt')
      .limit(5);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalBooks,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        recentOrders
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select('-password');

    res.json({
      success: true,
      message: 'User role updated',
      user
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};