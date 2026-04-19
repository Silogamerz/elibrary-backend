const Book = require('../models/Book');

// Get all books with filters
exports.getBooks = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10, sort = '-createdAt' } = req.query;
    
    let query = {};

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Search by title or author
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get books
    const books = await Book.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Book.countDocuments(query);

    res.json({
      success: true,
      books,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get single book
exports.getBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('reviews.user', 'name email');

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    res.json({ success: true, book });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Add review to book
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const bookId = req.params.id;

    // Validate input
    if (!rating || rating < 0 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be 0-5' });
    }

    // Find book
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    // Add review
    book.reviews.push({
      user: req.user.id,
      rating,
      comment
    });

    // Update average rating
    const avgRating = book.reviews.reduce((sum, r) => sum + r.rating, 0) / book.reviews.length;
    book.rating = avgRating;

    await book.save();

    res.json({
      success: true,
      message: 'Review added successfully',
      book
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get books by category
exports.getByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const books = await Book.find({ category }).limit(20);

    res.json({ success: true, books });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
