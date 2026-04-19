const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['programming', 'physics', 'mathematics', 'biology', 'engineering', 'history', 'chemistry', 'art', 'literature', 'economics'],
    required: true
  },
  isbn: {
    type: String,
    unique: true,
    sparse: true
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  rentPrice: {
    type: Number,
    default: 0
  },
  coverImage: {
    type: String,
    default: 'https://via.placeholder.com/150x220'
  },
  pages: {
    type: Number,
    default: 0
  },
  language: {
    type: String,
    default: 'English'
  },
  publishedDate: {
    type: Date,
    default: null
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: Number,
    comment: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  stock: {
    type: Number,
    default: 10
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Book', bookSchema);