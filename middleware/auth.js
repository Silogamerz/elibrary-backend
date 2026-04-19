const jwt = require('jsonwebtoken');

// Verify JWT Token
const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('❌ Auth error:', err);
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Admin Authorization
const adminAuth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    next();
  } catch (err) {
    console.error('❌ Admin auth error:', err);
    res.status(401).json({ success: false, message: 'Invalid token or insufficient permissions' });
  }
};

module.exports = { auth, adminAuth };