const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    user: {
      // The owner of this contact (who added them)
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^\+?[1-9]\d{9,14}$/, 'Please enter a valid phone number'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [200, 'Notes cannot exceed 200 characters'],
    },
    balance: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
      default: 100, // Starts at perfect 100%
    },
    totalTransactions: {
      type: Number,
      default: 0,
    },
    onTimePayments: {
      type: Number,
      default: 0,
    },
    latePayments: {
      type: Number,
      default: 0,
    },
    lastPaymentDate: {
      type: Date,
    },
    avatar: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound index: a user cannot have two contacts with the same phone
contactSchema.index({ user: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model('Contact', contactSchema);
