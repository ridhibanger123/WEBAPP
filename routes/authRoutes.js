const express = require('express');
const router = express.Router();
const {
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public authentication routes
router.post('/register', registerAdmin);
router.post('/login', loginAdmin);

// Private authenticated routes
router.post('/logout', protect, logoutAdmin);
router.get('/me', protect, getMe);

module.exports = router;
