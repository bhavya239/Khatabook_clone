/**
 * create_superadmin.js
 * ─────────────────────────────────────────────
 * Run this script locally to promote an existing
 * registered user to "superadmin".
 *
 * Usage:
 *   node create_superadmin.js <phone>
 *
 * Example:
 *   node create_superadmin.js 9016007312
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const phone = process.argv[2];

if (!phone) {
  console.error('❌  Usage: node create_superadmin.js <phone>');
  process.exit(1);
}

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅  MongoDB connected');

    const user = await User.findOne({ phone });
    if (!user) {
      console.error(`❌  No user found with phone: ${phone}`);
      process.exit(1);
    }

    user.role = 'superadmin';
    await user.save();

    console.log(`✅  ${user.name} (${user.phone}) is now a SUPERADMIN`);
    process.exit(0);
  } catch (err) {
    console.error('❌  Error:', err.message);
    process.exit(1);
  }
};

run();
