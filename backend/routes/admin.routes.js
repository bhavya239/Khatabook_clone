const express = require('express');
const router = express.Router();
const { getPlatformStats } = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/admin.middleware');

// Protect all admin routes automatically
router.use(protect);
router.use(isAdmin);

router.get('/stats', getPlatformStats);

module.exports = router;
