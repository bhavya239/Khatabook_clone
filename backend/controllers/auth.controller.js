const User = require('../models/User');
const { generateToken } = require('../utils/helpers');

// ──────────────────────────────────────────────
// @route   POST /api/auth/signup
// @desc    Register new user
// @access  Public
// ──────────────────────────────────────────────
const signup = async (req, res) => {
  try {
    const { name, phone, password, pin } = req.body;

    // Check if phone already registered
    const existing = await User.findOne({ phone });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Phone number already registered' });
    }

    // Strict 6-digit numeric validation for PIN
    if (pin && !/^\d{6}$/.test(pin)) {
      return res.status(400).json({ success: false, message: 'PIN must be exactly 6 numeric digits' });
    }

    // Create user (password is hashed in pre-save hook)
    const user = await User.create({ name, phone, password, pin });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        businessId: user.businessId,
        businessRole: user.businessRole,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Signup error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during signup' });
  }
};

// ──────────────────────────────────────────────
// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public
// ──────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Fetch user with password field (it's excluded by default)
    const user = await User.findOne({ phone }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid phone or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid phone or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact support.' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        businessId: user.businessId,
        businessRole: user.businessRole,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// ──────────────────────────────────────────────
// @route   GET /api/auth/me
// @desc    Get currently logged-in user
// @access  Private
// ──────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// @route   PUT /api/auth/pin
// @desc    Set / update unlock PIN
// @access  Private
// ──────────────────────────────────────────────
const setPin = async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin || !/^\d{6}$/.test(pin)) {
      return res.status(400).json({ success: false, message: 'PIN must be exactly 6 digits' });
    }

    const user = await User.findById(req.user._id);
    user.pin = pin; // hashed in pre-save hook
    await user.save();

    res.json({ success: true, message: 'PIN updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// @route   POST /api/auth/verify-pin
// @desc    Verify unlock PIN (for hidden mode)
// @access  Private
// ──────────────────────────────────────────────
const verifyPin = async (req, res) => {
  try {
    const { pin } = req.body;
    const user = await User.findById(req.user._id).select('+pin');
    const isMatch = await user.matchPin(pin);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect PIN' });
    }
    res.json({ success: true, message: 'PIN verified' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { signup, login, getMe, setPin, verifyPin };
