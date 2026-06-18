const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ─────────────────────────────────────────────────────────────
//  User Schema
//  Supports: auth (password + PIN), profile, email verification,
//            OTP-based flows, auto-lock, and multi-user business mode
// ─────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },

    email: {
      type: String,
      unique: true,
      sparse: true, // allows multiple docs with null email (phone-only users)
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },

    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      match: [/^\+?[1-9]\d{9,14}$/, 'Please enter a valid phone number'],
    },

    profileImage: {
      type: String,   // stores a URL (e.g. Cloudinary / S3 link)
      default: '',
    },

    // ── Authentication ─────────────────────────────────────────
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never returned in queries by default
    },

    /**
     * PIN – 4 or 6-digit app-unlock code.
     * Stored as a bcrypt hash (select: false so it's never leaked).
     */
    pin: {
      type: String,
      select: false,
    },

    // ── Email Verification ─────────────────────────────────────
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    /**
     * Temporarily holds a target email address when a user wants to
     * change or add their email, until verified via OTP.
     */
    pendingEmail: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
      select: false,
    },

    // ── OTP (One-Time Password) ────────────────────────────────
    /**
     * Raw OTP string (6-digit numeric code).
     * Cleared after successful verification.
     * select: false so it is never accidentally exposed.
     */
    otp: {
      type: String,
      select: false,
    },

    /**
     * Expiry timestamp for the OTP.
     * Set to Date.now() + 5 * 60 * 1000 (5 minutes) when OTP is generated.
     */
    otpExpiry: {
      type: Date,
      select: false,
    },

    // ── Security Settings ──────────────────────────────────────
    /**
     * Auto-lock interval in seconds. App locks itself after this period
     * of inactivity and requires PIN re-entry.
     * Allowed: 30 or 60 seconds. null = never auto-lock.
     */
    autoLockTime: {
      type: Number,
      enum: {
        values: [null, 30, 60],
        message: 'autoLockTime must be 30 or 60 seconds (or null to disable)',
      },
      default: null,
    },

    // ── Platform Role ──────────────────────────────────────────
    role: {
      type: String,
      enum: ['user', 'admin', 'superadmin'],
      default: 'user',
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // ── Multi-user Business Mode ───────────────────────────────
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      default: null,
    },

    businessRole: {
      type: String,
      enum: ['owner', 'staff', null],
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// ─────────────────────────────────────────────────────────────
//  Pre-save Hooks
// ─────────────────────────────────────────────────────────────

/**
 * Hash password with bcrypt (cost factor 12) before saving.
 * Only runs when the `password` field is new or modified.
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Hash PIN with bcrypt (cost factor 10) before saving.
 * Only runs when `pin` is present and modified.
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('pin') || !this.pin) return next();
  const salt = await bcrypt.genSalt(10);
  this.pin = await bcrypt.hash(this.pin, salt);
  next();
});

// ─────────────────────────────────────────────────────────────
//  Instance Methods
// ─────────────────────────────────────────────────────────────

/** Compare a plain-text password against the stored hash. */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

/** Compare a plain-text PIN against the stored hash. */
userSchema.methods.matchPin = async function (enteredPin) {
  if (!this.pin) return false;
  return bcrypt.compare(enteredPin, this.pin);
};

/**
 * Check whether a supplied OTP is still valid.
 * Returns false if OTP is missing or expired.
 */
userSchema.methods.isOtpValid = function (suppliedOtp) {
  if (!this.otp || !this.otpExpiry) return false;
  if (Date.now() > this.otpExpiry.getTime()) return false; // expired
  return this.otp === suppliedOtp;
};

/**
 * Clear OTP fields after successful verification.
 * Call this after a successful OTP check, then save().
 */
userSchema.methods.clearOtp = function () {
  this.otp = undefined;
  this.otpExpiry = undefined;
};

// ─────────────────────────────────────────────────────────────
//  Static Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Returns a Date 5 minutes from now — use when generating an OTP.
 * Usage: user.otpExpiry = User.otpExpiryDate();
 */
userSchema.statics.otpExpiryDate = function () {
  return new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
};

module.exports = mongoose.model('User', userSchema);
