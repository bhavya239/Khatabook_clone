/**
 * admin.middleware.js
 * Guards routes to platform admins and superadmins.
 */

// Allow both admin and superadmin roles
const isAdmin = (req, res, next) => {
  if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

// Strictly superadmin only
const isSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Super admin access required' });
  }
  next();
};

module.exports = { isAdmin, isSuperAdmin };
