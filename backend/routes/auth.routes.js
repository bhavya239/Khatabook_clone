const express = require('express');
const router = express.Router();
const { signup, login, getMe, setPin, verifyPin } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { signupValidator, loginValidator } = require('../middleware/validate.middleware');

// Public routes
router.post('/signup', signupValidator, signup);
router.post('/login', loginValidator, login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/pin', protect, setPin);
router.post('/verify-pin', protect, verifyPin);

module.exports = router;
