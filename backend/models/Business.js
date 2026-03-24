const mongoose = require('mongoose');

// ──────────────────────────────────────────────
// Business Schema
// A "Business" is a shared workspace. One owner can invite staff.
// All transactions/contacts in a business are scoped by businessId.
// ──────────────────────────────────────────────
const businessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Members: all staff + owner
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['owner', 'staff'], default: 'staff' },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Business', businessSchema);
