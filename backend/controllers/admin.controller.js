const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Contact = require('../models/Contact');
const Business = require('../models/Business');

// ──────────────────────────────────────────────
// @route   GET /api/admin/stats
// @desc    Platform-wide aggregate stats
// @access  Admin + SuperAdmin
// ──────────────────────────────────────────────
const getPlatformStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalTransactions = await Transaction.countDocuments();

    const result = await Transaction.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
    ]);
    const totalRevenue = result[0]?.totalRevenue || 0;

    res.json({ success: true, stats: { totalUsers, totalTransactions, totalRevenue } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// @route   GET /api/admin/users
// @desc    List all users (superadmin only)
// @access  SuperAdmin
// ──────────────────────────────────────────────
const listAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];

    const users = await User.find(query)
      .select('-password -pin')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await User.countDocuments(query);

    res.json({ success: true, total, page: Number(page), users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// @route   PUT /api/admin/users/:id/role
// @desc    Promote/demote a user's role
// @access  SuperAdmin
// ──────────────────────────────────────────────
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin', 'superadmin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    // Prevent self-demotion
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot change your own role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, select: '-password -pin' }
    );

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, message: `Role updated to ${role}`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// @route   PUT /api/admin/users/:id/toggle
// @desc    Enable / disable a user account
// @access  SuperAdmin
// ──────────────────────────────────────────────
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id, '-password -pin');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `Account ${user.isActive ? 'enabled' : 'disabled'}`,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// @route   GET /api/admin/overview
// @desc    Full platform overview for superadmin
// @access  SuperAdmin
// ──────────────────────────────────────────────
const getPlatformOverview = async (req, res) => {
  try {
    const [totalUsers, totalAdmins, totalSuperAdmins, totalTransactions, totalContacts, totalBusinesses] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'superadmin' }),
      Transaction.countDocuments(),
      Contact.countDocuments({ isActive: true }),
      Business.countDocuments({ isActive: true }),
    ]);

    const revenue = await Transaction.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const recentUsers = await User.find()
      .select('name phone role createdAt isActive')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      overview: {
        users: { total: totalUsers, admins: totalAdmins, superAdmins: totalSuperAdmins },
        totalTransactions,
        totalContacts,
        totalBusinesses,
        totalRevenue: revenue[0]?.total || 0,
        recentUsers,
      },
    });
  } catch (error) {
    console.error('Overview error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getPlatformStats, listAllUsers, updateUserRole, toggleUserStatus, getPlatformOverview };
