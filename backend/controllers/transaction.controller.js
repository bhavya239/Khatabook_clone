const Transaction = require('../models/Transaction');
const Contact = require('../models/Contact');
const { sendWhatsAppMessage } = require('../services/whatsapp.service');

// ──────────────────────────────────────────────
// @route   POST /api/transactions
// @desc    Add a new transaction and update contact balance
// @access  Private
// ──────────────────────────────────────────────
const addTransaction = async (req, res) => {
  try {
    const { contact: contactId, type, amount, description, date, category, dueDate } = req.body;

    // Verify contact belongs to this user
    const contact = await Contact.findOne({ _id: contactId, user: req.user._id });
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    // ──────────────────────────────────────────────
    // Balance Logic:
    //  given    → you gave money → balance increases (they owe you more)
    //  received → you received   → balance decreases (you owe them less / they owe you less)
    // ──────────────────────────────────────────────
    const balanceDelta = type === 'given' ? +amount : -amount;
    const updatedContact = await Contact.findOneAndUpdate(
      { _id: contactId, user: req.user._id },
      { $inc: { balance: balanceDelta } },
      { new: true }
    );

    if (!updatedContact) {
      return res.status(404).json({ success: false, message: 'Contact not found during calculation' });
    }

    if (type === 'received') {
      updatedContact.onTimePayments += 1;
      updatedContact.totalTransactions = updatedContact.onTimePayments + updatedContact.latePayments;
      updatedContact.score = Math.round((updatedContact.onTimePayments / updatedContact.totalTransactions) * 100);
      updatedContact.lastPaymentDate = new Date();
      await updatedContact.save();
    }

    // Create transaction with balance snapshot
    const transaction = await Transaction.create({
      user: req.user._id,
      contact: contactId,
      type,
      amount,
      description,
      date: date || Date.now(),
      category,
      balanceAfter: updatedContact.balance,
      dueDate: type === 'given' && dueDate ? new Date(dueDate) : undefined,
    });

    // ──────────────────────────────────────────────
    // WhatsApp Notification (non-blocking)
    // ──────────────────────────────────────────────
    try {
      const msgResult = await sendWhatsAppMessage({
        toPhone: contact.phone,
        toName: contact.name,
        contactId: contact._id,
        type,
        amount,
        balance: updatedContact.balance,
      });
      if (msgResult.success) {
        transaction.whatsappSent = true;
        transaction.whatsappSentAt = new Date();
        await transaction.save();
      }
    } catch (waErr) {
      // WhatsApp failure must NOT block the transaction
      console.warn('WhatsApp send failed (non-critical):', waErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Transaction added',
      transaction: await transaction.populate('contact', 'name phone'),
      newBalance: updatedContact.balance,
    });
  } catch (error) {
    console.error('Add transaction error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// @route   GET /api/transactions?contact=&startDate=&endDate=&type=&page=&limit=
// @desc    Get transactions with optional filters
// @access  Private
// ──────────────────────────────────────────────
const getTransactions = async (req, res) => {
  try {
    const { contact, startDate, endDate, type, page = 1, limit = 20, month, year } = req.query;

    const filter = { user: req.user._id };
    if (contact) filter.contact = contact;
    if (type) filter.type = type;

    let finalStartDate = startDate ? new Date(startDate) : undefined;
    let finalEndDate = endDate ? new Date(endDate) : undefined;

    if (month && year && !startDate && !endDate) {
      const targetMonth = Number(month) - 1;
      const targetYear = Number(year);
      finalStartDate = new Date(targetYear, targetMonth, 1);
      finalEndDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);
    }

    if (finalStartDate || finalEndDate) {
      filter.date = {};
      if (finalStartDate) filter.date.$gte = finalStartDate;
      if (finalEndDate) filter.date.$lte = finalEndDate;
    }

    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .populate('contact', 'name phone')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      transactions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// @route   GET /api/transactions/:id
// @desc    Get a single transaction
// @access  Private
// ──────────────────────────────────────────────
const getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate('contact', 'name phone balance');

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// @route   PUT /api/transactions/:id
// @desc    Update transaction description/category
// @access  Private
// NOTE: Amount/type changes are NOT allowed to prevent balance corruption.
// ──────────────────────────────────────────────
const updateTransaction = async (req, res) => {
  try {
    const { description, category } = req.body; // Only safe fields allowed

    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { description, category },
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.json({ success: true, message: 'Transaction updated', transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// @route   DELETE /api/transactions/:id
// @desc    Delete transaction and revert contact balance
// @access  Private
// ──────────────────────────────────────────────
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // Reverse the balance delta
    const reverseDelta = transaction.type === 'given' ? -transaction.amount : +transaction.amount;
    await Contact.findOneAndUpdate(
      { _id: transaction.contact, user: req.user._id },
      { $inc: { balance: reverseDelta } }
    );

    await transaction.deleteOne();

    res.json({ success: true, message: 'Transaction deleted and balance reversed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// @route   GET /api/transactions/summary
// @desc    Monthly summary: total given, received, net
// @access  Private
// ──────────────────────────────────────────────
const getSummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const targetMonth = month ? Number(month) - 1 : now.getMonth();
    const targetYear = year ? Number(year) : now.getFullYear();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    const summary = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const given = summary.find((s) => s._id === 'given') || { total: 0, count: 0 };
    const received = summary.find((s) => s._id === 'received') || { total: 0, count: 0 };

    // Per-contact balances
    const contactBalances = await Contact.find({ user: req.user._id, isActive: true })
      .select('name phone balance')
      .sort({ balance: -1 });

    res.json({
      success: true,
      period: { month: targetMonth + 1, year: targetYear },
      summary: {
        totalGiven: given.total,
        totalReceived: received.total,
        netBalance: given.total - received.total,
        transactionCount: given.count + received.count,
      },
      contactBalances,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// @route   POST /api/transactions/remind/:contactId
// @desc    Send WhatsApp reminder to a contact
// @access  Private
// ──────────────────────────────────────────────
const sendReminder = async (req, res) => {
  try {
    const contact = await Contact.findOne({ _id: req.params.contactId, user: req.user._id });
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    if (contact.balance <= 0) {
      return res.status(400).json({ success: false, message: 'No pending balance to remind about' });
    }

    const result = await sendWhatsAppMessage({
      toPhone: contact.phone,
      toName: contact.name,
      contactId: contact._id,
      type: 'reminder',
      amount: 0,
      balance: contact.balance,
    });

    res.json({ success: true, message: 'Reminder sent', whatsappLink: result.fallbackLink });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// @route   GET /api/transactions/overdue
// @desc    Get all overdue transactions with penalties
// @access  Private
// ──────────────────────────────────────────────
const getOverdueTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      user: req.user._id,
      isOverdue: true
    }).populate('contact', 'name phone').sort({ date: -1 });
    
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  addTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
  getSummary,
  sendReminder,
  getOverdueTransactions,
};
