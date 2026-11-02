const Admin = require('../models/Admin');

/**
 * @desc    Register a new Admin (Initial Setup)
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validation check
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, and password',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // 2. Check if admin with this email already exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'An administrator with this email already exists',
      });
    }

    // 3. Create new Admin (password is automatically hashed by our Mongoose pre-save hook)
    const admin = await Admin.create({
      name,
      email: email.toLowerCase(),
      password,
    });

    // 4. Save session data
    req.session.adminId = admin._id;
    req.session.adminName = admin.name;
    req.session.adminEmail = admin.email;

    return res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration',
    });
  }
};

/**
 * @desc    Authenticate Admin & start session
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validation check
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    // 2. Find admin by email
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // 3. Verify password hash using our schema method
    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // 4. Create session
    req.session.adminId = admin._id;
    req.session.adminName = admin.name;
    req.session.adminEmail = admin.email;

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login',
    });
  }
};

/**
 * @desc    Logout Admin & destroy session
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logoutAdmin = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Failed to logout, please try again',
      });
    }

    res.clearCookie('connect.sid'); // Clear browser session cookie
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  });
};

/**
 * @desc    Get currently logged-in Admin profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    if (!req.session || !req.session.adminId) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const admin = await Admin.findById(req.session.adminId).select('-password');
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin account not found',
      });
    }

    return res.status(200).json({
      success: true,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving admin profile',
    });
  }
};

module.exports = {
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  getMe,
};
