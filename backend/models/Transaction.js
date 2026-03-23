const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      required: true,
      index: true,
    },
    type: {
      // 'given'    → You gave money to contact (they owe you → balance increases)
      // 'received' → You received money from contact (balance decreases)
      type: String,
      enum: ['given', 'received'],
      required: [true, 'Transaction type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be at least ₹1'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    // Snapshot of balance AFTER this transaction was applied
    balanceAfter: {
      type: Number,
      default: 0,
    },
    // Whether a WhatsApp notification was sent for this transaction
    whatsappSent: {
      type: Boolean,
      default: false,
    },
    whatsappSentAt: {
      type: Date,
    },
    category: {
      type: String,
      enum: ['loan', 'business', 'personal', 'rent', 'food', 'other'],
      default: 'other',
    },
  },
  { timestamps: true }
);

// Index for date-range queries
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ contact: 1, date: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
