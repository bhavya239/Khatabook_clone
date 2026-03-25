const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      match: [/^\+?[1-9]\d{9,14}$/, 'Please enter a valid phone number'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Never return password in queries by default
    },
    pin: {
      type: String,
      select: false, // Hidden PIN for app unlock
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'superadmin'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Multi-user business mode
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      default: null,
    },
    businessRole: {
      type: String,
      enum: ['owner', 'staff'],
      default: null,
    },
  },
  { timestamps: true }
);

// ──────────────────────────────────────────────
// Pre-save Hook: Hash password before saving
// ──────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  // Only hash if password field was modified
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Hash PIN if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('pin') || !this.pin) return next();
  const salt = await bcrypt.genSalt(10);
  this.pin = await bcrypt.hash(this.pin, salt);
  next();
});

// ──────────────────────────────────────────────
// Instance Method: Compare entered password
// ──────────────────────────────────────────────
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Instance Method: Compare entered PIN
userSchema.methods.matchPin = async function (enteredPin) {
  if (!this.pin) return false;
  return await bcrypt.compare(enteredPin, this.pin);
};

module.exports = mongoose.model('User', userSchema);
