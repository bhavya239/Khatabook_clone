const Transaction = require('../models/Transaction');

// ──────────────────────────────────────────────
// @route   GET /api/reports/profit-loss
// @desc    Get income, expense, net profit, and breakdowns
// @access  Private
// ──────────────────────────────────────────────
const getProfitLossReport = async (req, res) => {
  try {
    const { mode } = req.query; // 'personal' | 'business' | 'all'
    
    // Base match filter
    const matchFilter = { user: req.user._id };
    
    // Implement "Switch mode (personal/business)" here!
    if (mode === 'business') {
      matchFilter.category = 'business';
    } else if (mode === 'personal') {
      matchFilter.category = { $ne: 'business' };
    }

    const transactions = await Transaction.aggregate([
      { $match: matchFilter },
      {
         $group: {
            _id: { month: { $month: "$date" }, year: { $year: "$date" } },
            income: { $sum: { $cond: [{ $eq: ["$type", "received"] }, "$amount", 0] } },
            expense: { $sum: { $cond: [{ $eq: ["$type", "given"] }, "$amount", 0] } }
         }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const monthlyBreakdown = transactions.map(t => ({
       month: `${monthNames[t._id.month - 1]} ${t._id.year}`,
       income: t.income,
       expense: t.expense,
       profit: t.income - t.expense
    }));

    const totalIncome = transactions.reduce((sum, t) => sum + t.income, 0);
    const totalExpense = transactions.reduce((sum, t) => sum + t.expense, 0);
    const profit = totalIncome - totalExpense;

    const categoryBreakdown = await Transaction.aggregate([
      { $match: matchFilter },
      { $group: { _id: "$category", total: { $sum: "$amount" } } }
    ]);

    res.json({
      success: true,
      totalIncome,
      totalExpense,
      profit,
      monthlyBreakdown,
      categoryBreakdown: categoryBreakdown.map(c => ({ name: c._id || 'unknown', value: c.total }))
    });
  } catch (error) {
    console.error('P&L Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getProfitLossReport };
