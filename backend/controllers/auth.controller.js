const User = require('../models/User');
const { generateToken } = require('../utils/helpers');
const { generateOtp, otpExpiryDate, isOtpExpired } = require('../utils/otp');
const { sendOtpEmail } = require('../services/email.service');

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

// ──────────────────────────────────────────────
// @route   POST /api/auth/send-otp
// @desc    Generate & email a 6-digit OTP
// @access  Private  (user must be logged in to verify their email)
// ──────────────────────────────────────────────
const sendOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Destination email — prefer body param, fall back to stored email
    const email = req.body.email || user.email;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'No email address on file. Pass an email in the request body.',
      });
    }

    // Rate-guard: don't allow re-send if a valid OTP is still fresh (< 1 min old)
    if (user.otpExpiry && !isOtpExpired(user.otpExpiry)) {
      const secondsLeft = Math.ceil((new Date(user.otpExpiry).getTime() - Date.now()) / 1000);
      if (secondsLeft > 240) { // still more than 4 min remaining → too soon
        return res.status(429).json({
          success: false,
          message: `OTP already sent. Please wait ${secondsLeft - 240}s before requesting another.`,
        });
      }
    }

    // Generate OTP and set expiry
    const otp = generateOtp();
    user.otp = otp;
    user.otpExpiry = otpExpiryDate(); // now + 5 min

    // Persist email if it's new
    if (req.body.email && !user.email) {
      user.email = req.body.email;
    }

    await user.save({ validateModifiedOnly: true });

    // Send email
    await sendOtpEmail({
      to: email,
      otp,
      purpose: req.body.purpose || 'email verification',
    });

    res.json({
      success: true,
      message: `OTP sent to ${email}. Valid for 5 minutes.`,
    });
  } catch (error) {
    console.error('sendOtp error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
  }
};

// ──────────────────────────────────────────────
// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and mark email as verified
// @access  Private
// ──────────────────────────────────────────────
const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: 'OTP must be a 6-digit number' });
    }

    // Fetch user with OTP fields (both are select: false)
    const user = await User.findById(req.user._id).select('+otp +otpExpiry');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Guard: no OTP was ever issued
    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new one.',
      });
    }

    // Guard: OTP expired
    if (isOtpExpired(user.otpExpiry)) {
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save({ validateModifiedOnly: true });
      return res.status(410).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
    }

    // Guard: OTP mismatch
    if (user.otp !== otp) {
      return res.status(401).json({ success: false, message: 'Incorrect OTP' });
    }

    // ✅ OTP is valid — mark email verified and clear OTP fields
    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save({ validateModifiedOnly: true });

    res.json({
      success: true,
      message: 'Email verified successfully.',
      isEmailVerified: true,
    });
  } catch (error) {
    console.error('verifyOtp error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during OTP verification' });
  }
};

// ──────────────────────────────────────────────
// @route   POST /api/auth/forgot-password
// @desc    Send OTP to email for password reset
// @access  Public
// ──────────────────────────────────────────────
const sendPasswordResetOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't leak whether the email exists or not in high-security apps,
      // but for better UX we might return 404.
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }

    // Rate-guard
    if (user.otpExpiry && !isOtpExpired(user.otpExpiry)) {
      const secondsLeft = Math.ceil((new Date(user.otpExpiry).getTime() - Date.now()) / 1000);
      if (secondsLeft > 240) {
        return res.status(429).json({ success: false, message: 'OTP already sent recently. Please check your email.' });
      }
    }

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpiry = otpExpiryDate();
    await user.save({ validateModifiedOnly: true });

    await sendOtpEmail({
      to: email,
      otp,
      purpose: 'password reset',
    });

    res.json({ success: true, message: `Password reset OTP sent to ${email}` });
  } catch (error) {
    console.error('sendPasswordResetOtp error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// @route   POST /api/auth/change-password
// @desc    Verify OTP and change password
// @access  Public
// ──────────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Fetch user with ALL needed excluded fields
    const user = await User.findOne({ email }).select('+password +otp +otpExpiry');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Guard: OTP presence & expiry
    if (!user.otp || !user.otpExpiry || isOtpExpired(user.otpExpiry)) {
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save({ validateModifiedOnly: true });
      return res.status(400).json({ success: false, message: 'OTP is missing or expired' });
    }

    // Guard: OTP mismatch
    if (user.otp !== otp) {
      return res.status(401).json({ success: false, message: 'Invalid OTP' });
    }

    // Optional Security: Verify new password is not the same as the old one
    const isSamePassword = await user.matchPassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({ success: false, message: 'New password cannot be the same as the old password' });
    }

    // Update password (will be hashed automatically by UserSchema's pre-save middleware)
    user.password = newPassword;
    
    // Clear OTP fields to prevent reuse
    user.otp = undefined;
    user.otpExpiry = undefined;
    
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('changePassword error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during password change' });
  }
};

// ──────────────────────────────────────────────
// @route   POST /api/auth/change-pin
// @desc    Verify OTP and change PIN
// @access  Public
// ──────────────────────────────────────────────
const changePinWithOtp = async (req, res) => {
  try {
    const { email, otp, newPin } = req.body;

    if (!email || !otp || !newPin) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and new PIN are required' });
    }

    // Exact 6 digits numeric validation
    if (!/^\d{6}$/.test(newPin)) {
      return res.status(400).json({ success: false, message: 'PIN must be exactly 6 numeric digits' });
    }

    // Fetch user with ALL needed excluded fields
    const user = await User.findOne({ email }).select('+pin +otp +otpExpiry');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Guard: OTP presence & expiry
    if (!user.otp || !user.otpExpiry || isOtpExpired(user.otpExpiry)) {
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save({ validateModifiedOnly: true });
      return res.status(400).json({ success: false, message: 'OTP is missing or expired' });
    }

    // Guard: OTP mismatch
    if (user.otp !== otp) {
      return res.status(401).json({ success: false, message: 'Invalid OTP' });
    }

    // Optional Security: Verify new PIN is not the same as the old one
    const isSamePin = await user.matchPin(newPin);
    if (isSamePin) {
      return res.status(400).json({ success: false, message: 'New PIN cannot be the same as the old PIN' });
    }

    // Update PIN (hashed automatically by UserSchema's pre-save middleware)
    user.pin = newPin;
    
    // Clear OTP fields to prevent reuse
    user.otp = undefined;
    user.otpExpiry = undefined;
    
    await user.save();

    res.json({ success: true, message: 'PIN changed successfully' });
  } catch (error) {
    console.error('changePinWithOtp error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during PIN change' });
  }
};

// ──────────────────────────────────────────────
// @route   POST /api/auth/request-email-update
// @desc    Request to add/change email. Sends OTP to new email.
// @access  Private
// ──────────────────────────────────────────────
const requestEmailUpdate = async (req, res) => {
  try {
    const { newEmail } = req.body;
    if (!newEmail) {
      return res.status(400).json({ success: false, message: 'New email is required' });
    }

    // Check if new email is already taken by someone else
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
      return res.status(409).json({ success: false, message: 'This email is already registered to another account' });
    }

    const user = await User.findById(req.user._id);

    // Rate-guard
    if (user.otpExpiry && !isOtpExpired(user.otpExpiry)) {
      const secondsLeft = Math.ceil((new Date(user.otpExpiry).getTime() - Date.now()) / 1000);
      if (secondsLeft > 240) {
        return res.status(429).json({ success: false, message: 'OTP recently sent. Please wait before requesting another.' });
      }
    }

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpiry = otpExpiryDate();
    user.pendingEmail = newEmail;
    await user.save({ validateModifiedOnly: true });

    await sendOtpEmail({
      to: newEmail,
      otp,
      purpose: 'email update verification',
    });

    res.json({ success: true, message: `Verification OTP sent to ${newEmail}` });
  } catch (error) {
    console.error('requestEmailUpdate error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during email update request' });
  }
};

// ──────────────────────────────────────────────
// @route   POST /api/auth/update-email
// @desc    Verify OTP and natively update user email
// @access  Private
// ──────────────────────────────────────────────
const updateEmail = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: 'OTP must be a 6-digit number' });
    }

    const user = await User.findById(req.user._id).select('+otp +otpExpiry +pendingEmail');

    // Guard: Missing OTP or pendingEmail context
    if (!user.otp || !user.otpExpiry || !user.pendingEmail || isOtpExpired(user.otpExpiry)) {
      user.otp = undefined;
      user.otpExpiry = undefined;
      user.pendingEmail = undefined;
      await user.save({ validateModifiedOnly: true });
      return res.status(400).json({ success: false, message: 'OTP is missing or expired. Please request a new one.' });
    }

    // Guard: Invalid OTP
    if (user.otp !== otp) {
      return res.status(401).json({ success: false, message: 'Invalid OTP' });
    }

    // Guard: Race Condition Duplicate Check
    const existingUser = await User.findOne({ email: user.pendingEmail });
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
       user.otp = undefined;
       user.otpExpiry = undefined;
       user.pendingEmail = undefined;
       await user.save({ validateModifiedOnly: true });
       return res.status(409).json({ success: false, message: 'This email was just registered by another user. Please choose another.' });
    }

    // Promote pendingEmail to the primary email
    user.email = user.pendingEmail;
    user.isEmailVerified = true;

    // Clear verification fields
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.pendingEmail = undefined;
    
    await user.save();

    res.json({ success: true, message: 'Email updated successfully', email: user.email });
  } catch (error) {
    console.error('updateEmail error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during final email update' });
  }
};

// ──────────────────────────────────────────────
// @route   POST /api/auth/upload-profile-image
// @desc    Upload profile image to Cloudinary and update user
// @access  Private
// ──────────────────────────────────────────────
const uploadProfileImage = async (req, res) => {
  try {
    // Multer places the securely uploaded file details into `req.file`
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please provide a valid image file' });
    }

    // multer-storage-cloudinary natively returns the live Cloudinary CDN URL onto `req.file.path`
    const imageUrl = req.file.path;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Persist securely into the schema
    user.profileImage = imageUrl;
    await user.save({ validateModifiedOnly: true });

    res.json({
      success: true,
      message: 'Profile image updated successfully',
      profileImage: user.profileImage,
    });
  } catch (error) {
    console.error('uploadProfileImage error:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Server error uploading profile image' });
  }
};

// ──────────────────────────────────────────────
// @route   PUT /api/auth/auto-lock
// @desc    Update auto-lock time preference
// @access  Private
// ──────────────────────────────────────────────
const updateAutoLock = async (req, res) => {
  try {
    const { time } = req.body;
    
    // Time must be 30, 60, or null
    if (time !== 30 && time !== 60 && time !== null) {
      return res.status(400).json({ success: false, message: 'Auto-lock time must be 30, 60 or null' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.autoLockTime = time;
    await user.save({ validateModifiedOnly: true });

    res.json({ success: true, message: 'Auto-lock preferences updated', autoLockTime: user.autoLockTime });
  } catch (error) {
    console.error('updateAutoLock error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating auto-lock' });
  }
};

module.exports = { signup, login, getMe, setPin, verifyPin, sendOtp, verifyOtp, sendPasswordResetOtp, changePassword, changePinWithOtp, requestEmailUpdate, updateEmail, uploadProfileImage, updateAutoLock };
