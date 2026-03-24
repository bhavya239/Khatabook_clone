/**
 * Middleware: Ensure the user is an admin.
 * Important: This MUST run after the `protect` middleware.
 */
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    // 403 Forbidden is the proper status code for unauthorized role access
    res.status(403).json({
      success: false,
      message: 'Access Denied: Super Admin privileges are required.',
    });
  }
};

module.exports = { isAdmin };
