const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { isAdmin, isSuperAdmin } = require('../middleware/admin.middleware');
const {
  getPlatformStats,
  listAllUsers,
  updateUserRole,
  toggleUserStatus,
  getPlatformOverview,
} = require('../controllers/admin.controller');

// All admin routes require login
router.use(protect);

// Admin + SuperAdmin
router.get('/stats', isAdmin, getPlatformStats);

// SuperAdmin only
router.get('/overview', isSuperAdmin, getPlatformOverview);
router.get('/users', isSuperAdmin, listAllUsers);
router.put('/users/:id/role', isSuperAdmin, updateUserRole);
router.put('/users/:id/toggle', isSuperAdmin, toggleUserStatus);

module.exports = router;
