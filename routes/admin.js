const express = require('express');
const router = express.Router();
const { 
  createBook, 
  updateBook, 
  deleteBook, 
  getAllUsers, 
  getAllOrders, 
  getStats, 
  updateUserRole 
} = require('../controllers/adminController');
const { adminAuth } = require('../middleware/auth');

// All admin routes are protected
router.post('/books', adminAuth, createBook);
router.put('/books/:id', adminAuth, updateBook);
router.delete('/books/:id', adminAuth, deleteBook);

router.get('/users', adminAuth, getAllUsers);
router.put('/users/:userId/role', adminAuth, updateUserRole);

router.get('/orders', adminAuth, getAllOrders);

router.get('/stats', adminAuth, getStats);

module.exports = router;