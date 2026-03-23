const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT token for a given user ID.
 * @param {string} id - MongoDB User _id
 * @returns {string} Signed JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

/**
 * Format a generic API response.
 */
const successResponse = (res, statusCode, message, data = {}) => {
  return res.status(statusCode).json({ success: true, message, ...data });
};

const errorResponse = (res, statusCode, message) => {
  return res.status(statusCode).json({ success: false, message });
};

module.exports = { generateToken, successResponse, errorResponse };
