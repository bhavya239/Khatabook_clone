const express = require('express');
const router = express.Router();
const { signup, login, getMe, setPin, verifyPin, sendOtp, verifyOtp, sendPasswordResetOtp, changePassword, changePinWithOtp, requestEmailUpdate, updateEmail, uploadProfileImage, updateAutoLock } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const { signupValidator, loginValidator } = require('../middleware/validate.middleware');

// Public routes
router.post('/signup', signupValidator, signup);
router.post('/login', loginValidator, login);
router.post('/forgot-password', sendPasswordResetOtp);
router.post('/change-password', changePassword);
router.post('/change-pin', changePinWithOtp);

// Protected routes
router.get('/me', protect, getMe);
router.put('/pin', protect, setPin);
router.post('/verify-pin', protect, verifyPin);

// OTP routes
router.post('/send-otp', protect, sendOtp);
router.post('/verify-otp', protect, verifyOtp);

// Email update routes
router.post('/request-email-update', protect, requestEmailUpdate);
router.post('/update-email', protect, updateEmail);

// Profile Settings
router.post('/upload-profile-image', protect, upload.single('image'), uploadProfileImage);
router.put('/auto-lock', protect, updateAutoLock);

module.exports = router;
