const express = require('express');
const router = express.Router();
const { getBooks, getBook, addReview, getByCategory } = require('../controllers/bookController');
const { auth } = require('../middleware/auth');

// Public routes
router.get('/', getBooks);
router.get('/category/:category', getByCategory);
router.get('/:id', getBook);

// Protected routes
router.post('/:id/review', auth, addReview);

module.exports = router;