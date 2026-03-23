const { body, param, query, validationResult } = require('express-validator');

/**
 * Centralized handler: returns 422 if validation failed.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ──────────────────────────────────────────────
// Auth Validators
// ──────────────────────────────────────────────
const signupValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone is required')
    .matches(/^\+?[1-9]\d{9,14}$/)
    .withMessage('Invalid phone number format'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate,
];

const loginValidator = [
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

// ──────────────────────────────────────────────
// Contact Validators
// ──────────────────────────────────────────────
const contactValidator = [
  body('name').trim().notEmpty().withMessage('Contact name is required').isLength({ max: 50 }),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone is required')
    .matches(/^\+?[1-9]\d{9,14}$/)
    .withMessage('Invalid phone number format'),
  body('notes').optional().isLength({ max: 200 }).withMessage('Notes too long'),
  validate,
];

// ──────────────────────────────────────────────
// Transaction Validators
// ──────────────────────────────────────────────
const transactionValidator = [
  body('contact').notEmpty().withMessage('Contact ID is required').isMongoId().withMessage('Invalid contact ID'),
  body('type').isIn(['given', 'received']).withMessage('Type must be "given" or "received"'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least ₹1'),
  body('description').optional().isLength({ max: 300 }),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('category')
    .optional()
    .isIn(['loan', 'business', 'personal', 'rent', 'food', 'other'])
    .withMessage('Invalid category'),
  validate,
];

module.exports = {
  signupValidator,
  loginValidator,
  contactValidator,
  transactionValidator,
};
