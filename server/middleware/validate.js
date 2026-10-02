const { body, query, param, validationResult } = require('express-validator');

/**
 * Handle validation errors from express-validator.
 * Returns 400 with array of error messages if validation fails.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

/**
 * Sanitize a string — strip HTML tags and trim whitespace.
 */
const sanitizeString = (value) => {
  if (typeof value !== 'string') return value;
  return value.replace(/<[^>]*>/g, '').trim();
};

// ─── Registration Validators ────────────────────────────────────────────────
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .customSanitizer(sanitizeString),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),

  handleValidationErrors,
];

// ─── Login Validators ───────────────────────────────────────────────────────
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  handleValidationErrors,
];

// ─── Expense Validators ─────────────────────────────────────────────────────
const VALID_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Bills & Utilities',
  'Entertainment',
  'Health & Fitness',
  'Education',
  'Travel',
  'Groceries',
  'Other',
];

const expenseValidation = [
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.01, max: 99999999.99 })
    .withMessage('Amount must be between 0.01 and 99,999,999.99'),

  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn(VALID_CATEGORIES)
    .withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters')
    .customSanitizer(sanitizeString),

  body('expense_date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be a valid date format (YYYY-MM-DD)')
    .custom((value) => {
      const inputDate = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (inputDate > today) {
        throw new Error('Expense date cannot be in the future');
      }
      const minDate = new Date('2000-01-01');
      if (inputDate < minDate) {
        throw new Error('Expense date cannot be before year 2000');
      }
      return true;
    }),

  handleValidationErrors,
];

// ─── Query Validators (Search / Filter) ──────────────────────────────────────
const expenseQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('category')
    .optional()
    .trim()
    .isIn([...VALID_CATEGORIES, ''])
    .withMessage(`Invalid category filter`),

  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),

  query('minAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum amount must be a non-negative number'),

  query('maxAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum amount must be a non-negative number'),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Search query must not exceed 200 characters')
    .customSanitizer(sanitizeString),

  query('sortBy')
    .optional()
    .isIn(['expense_date', 'amount', 'category', 'created_at'])
    .withMessage('Sort by must be one of: expense_date, amount, category, created_at'),

  query('order')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('Order must be ASC or DESC'),

  handleValidationErrors,
];

// ─── Param ID Validator ──────────────────────────────────────────────────────
const idParamValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID must be a valid MongoDB ObjectId'),

  handleValidationErrors,
];

module.exports = {
  registerValidation,
  loginValidation,
  expenseValidation,
  expenseQueryValidation,
  idParamValidation,
  VALID_CATEGORIES,
};
