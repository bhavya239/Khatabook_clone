const User = require('../models/User');
const Transaction = require('../models/Transaction');

// ──────────────────────────────────────────────
// @route   GET /api/admin/stats
// @desc    Get aggregate platform statistics
// @access  Private/Admin
// ──────────────────────────────────────────────
const getPlatformStats = async (req, res) => {
  try {
    // Count all users on the platform (excluding admins in the count if preferred, 
    // but typically all users is standard)
    const totalUsers = await User.countDocuments({ role: 'user' });

    // Count pure volume of transactions securely
    const totalTransactions = await Transaction.countDocuments();

    // Calculate total money moved on the platform
    // We do NOT populate or fetch individual transactions
    const result = await Transaction.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' } // Summing sheer volume of money tracked
        }
      }
    ]);

    const totalRevenue = result.length > 0 ? result[0].totalRevenue : 0;

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalTransactions,
        totalRevenue
      }
    });

  } catch (error) {
    console.error('Admin API error:', error.message);
    res.status(500).json({ success: false, message: 'Server error parsing stats' });
  }
};

module.exports = {
  getPlatformStats
};
