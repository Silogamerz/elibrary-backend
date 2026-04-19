const Order = require('../models/Order');
const Book = require('../models/Book');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create order
exports.createOrder = async (req, res) => {
  try {
    const { books, shippingAddress, rentalDuration } = req.body;

    if (!books || books.length === 0) {
      return res.status(400).json({ success: false, message: 'No books in order' });
    }

    // Calculate total amount
    let totalAmount = 0;
    const orderBooks = [];

    for (let item of books) {
      const book = await Book.findById(item.bookId);
      if (!book) {
        return res.status(404).json({ success: false, message: `Book ${item.bookId} not found` });
      }

      const price = item.type === 'rent' ? book.rentPrice : book.price;
      totalAmount += price * (item.quantity || 1);

      orderBooks.push({
        book: item.bookId,
        quantity: item.quantity || 1,
        price,
        type: item.type || 'buy'
      });
    }

    // Create order
    const order = new Order({
      user: req.user.id,
      books: orderBooks,
      totalAmount,
      shippingAddress,
      rentalDuration: rentalDuration || 0,
      status: 'pending'
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get user orders
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('books.book')
      .sort('-createdAt');

    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get order by ID
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('books.book');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Process Stripe payment
exports.processPayment = async (req, res) => {
  try {
    const { orderId, token } = req.body;

    // Find order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Create Stripe charge
    const charge = await stripe.charges.create({
      amount: Math.round(order.totalAmount * 100),
      currency: 'usd',
      source: token,
      description: `Order ${orderId} - E-Library`
    });

    // Update order
    order.status = 'paid';
    order.stripePaymentId = charge.id;
    order.paymentMethod = 'stripe';
    await order.save();

    res.json({
      success: true,
      message: 'Payment processed successfully',
      order
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('books.book');

    res.json({
      success: true,
      message: 'Order status updated',
      order
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};