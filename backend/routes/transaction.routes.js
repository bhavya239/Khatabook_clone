const express = require('express');
const router = express.Router();
const {
  addTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
  getSummary,
  sendReminder,
  getOverdueTransactions,
} = require('../controllers/transaction.controller');
const { protect } = require('../middleware/auth.middleware');
const { transactionValidator } = require('../middleware/validate.middleware');

// All transaction routes are protected
router.use(protect);

// Summary and reminder (specific paths before /:id)
router.get('/summary', getSummary);
router.get('/overdue', getOverdueTransactions);
router.post('/remind/:contactId', sendReminder);

router.route('/')
  .get(getTransactions)
  .post(transactionValidator, addTransaction);

router.route('/:id')
  .get(getTransaction)
  .put(updateTransaction)
  .delete(deleteTransaction);

module.exports = router;
