/**
 * utils/otp.js
 * ─────────────────────────────────────────────────────────────
 * Pure OTP utility functions.
 * No I/O or DB access here — keeps the service layer clean.
 * ─────────────────────────────────────────────────────────────
 */

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Generate a cryptographically random 6-digit numeric OTP.
 * Uses Math.random as a simple fallback; swap with crypto for
 * higher-security environments.
 *
 * @returns {string}  Zero-padded 6-digit string e.g. "047291"
 */
const generateOtp = () => {
  // Generates a number between 100000 and 999999 (always 6 digits)
  const otp = Math.floor(100000 + Math.random() * 900000);
  return String(otp);
};

/**
 * Return the Date object representing OTP expiry ( now + 5 min ).
 *
 * @returns {Date}
 */
const otpExpiryDate = () => new Date(Date.now() + OTP_TTL_MS);

/**
 * Check whether a stored OTP is still within its valid window.
 *
 * @param {Date|string} otpExpiry  - The expiry value stored on the user doc
 * @returns {boolean}
 */
const isOtpExpired = (otpExpiry) => {
  if (!otpExpiry) return true;
  return Date.now() > new Date(otpExpiry).getTime();
};

module.exports = { generateOtp, otpExpiryDate, isOtpExpired, OTP_TTL_MS };
