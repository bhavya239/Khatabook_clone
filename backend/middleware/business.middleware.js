/**
 * Business Role Middleware
 * Ensures the requesting user belongs to a business and optionally holds a specific role.
 *
 * Usage:
 *   requireBusiness         → user must be in any business
 *   requireRole('owner')    → user must be owner of their business
 */

const requireBusiness = (req, res, next) => {
  if (!req.user.businessId) {
    return res.status(403).json({ success: false, message: 'You must belong to a business to access this resource' });
  }
  next();
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user.businessId) {
    return res.status(403).json({ success: false, message: 'Business membership required' });
  }
  if (!roles.includes(req.user.businessRole)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.businessRole}`,
    });
  }
  next();
};

module.exports = { requireBusiness, requireRole };
