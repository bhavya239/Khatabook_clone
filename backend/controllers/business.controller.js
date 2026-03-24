const Business = require('../models/Business');
const User = require('../models/User');

// ──────────────────────────────────────────────
// @route   POST /api/business/create
// @desc    Create a new business workspace
// @access  Private
// ──────────────────────────────────────────────
const createBusiness = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Business name is required' });
    }

    // A user can only own one business (or join another)
    if (req.user.businessId) {
      return res.status(409).json({ success: false, message: 'You already belong to a business. Leave it first.' });
    }

    const business = await Business.create({
      name,
      ownerId: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }],
    });

    // Update user's businessId and role
    await User.findByIdAndUpdate(req.user._id, {
      businessId: business._id,
      businessRole: 'owner',
    });

    res.status(201).json({ success: true, message: 'Business created', business });
  } catch (error) {
    console.error('Create business error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// @route   GET /api/business/me
// @desc    Get current user's business
// @access  Private
// ──────────────────────────────────────────────
const getMyBusiness = async (req, res) => {
  try {
    if (!req.user.businessId) {
      return res.status(404).json({ success: false, message: 'You are not part of any business' });
    }

    const business = await Business.findById(req.user.businessId)
      .populate('members.user', 'name phone avatar');

    res.json({ success: true, business });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// @route   POST /api/business/invite
// @desc    Owner invites a user by phone number (makes them staff)
// @access  Private (owner only)
// ──────────────────────────────────────────────
const inviteStaff = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required' });

    // Verify caller is the business owner
    if (req.user.businessRole !== 'owner') {
      return res.status(403).json({ success: false, message: 'Only the business owner can invite staff' });
    }

    const invitee = await User.findOne({ phone });
    if (!invitee) {
      return res.status(404).json({ success: false, message: 'No user registered with that phone number' });
    }
    if (invitee.businessId) {
      return res.status(409).json({ success: false, message: 'This user already belongs to a business' });
    }

    const business = await Business.findById(req.user.businessId);

    // Add to members array
    business.members.push({ user: invitee._id, role: 'staff' });
    await business.save();

    // Update invitee's user record
    await User.findByIdAndUpdate(invitee._id, {
      businessId: business._id,
      businessRole: 'staff',
    });

    res.json({ success: true, message: `${invitee.name} added as staff`, business });
  } catch (error) {
    console.error('Invite staff error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// @route   PUT /api/business/role
// @desc    Owner changes a staff member's role
// @access  Private (owner only)
// ──────────────────────────────────────────────
const assignRole = async (req, res) => {
  try {
    const { userId, role } = req.body;
    if (!['owner', 'staff'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be owner or staff' });
    }

    if (req.user.businessRole !== 'owner') {
      return res.status(403).json({ success: false, message: 'Only the owner can assign roles' });
    }

    const business = await Business.findById(req.user.businessId);
    const member = business.members.find(m => m.user.toString() === userId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'User is not a member of this business' });
    }

    member.role = role;
    await business.save();

    await User.findByIdAndUpdate(userId, { businessRole: role });

    res.json({ success: true, message: 'Role updated', business });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// @route   DELETE /api/business/remove/:userId
// @desc    Owner removes a staff member
// @access  Private (owner only)
// ──────────────────────────────────────────────
const removeStaff = async (req, res) => {
  try {
    if (req.user.businessRole !== 'owner') {
      return res.status(403).json({ success: false, message: 'Only the owner can remove staff' });
    }

    const { userId } = req.params;
    const business = await Business.findById(req.user.businessId);
    business.members = business.members.filter(m => m.user.toString() !== userId);
    await business.save();

    await User.findByIdAndUpdate(userId, { businessId: null, businessRole: null });

    res.json({ success: true, message: 'Staff member removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// @route   DELETE /api/business/leave
// @desc    Staff leaves their business
// @access  Private
// ──────────────────────────────────────────────
const leaveBusiness = async (req, res) => {
  try {
    if (req.user.businessRole === 'owner') {
      return res.status(400).json({ success: false, message: 'Owner cannot leave. Transfer ownership or delete the business.' });
    }

    const business = await Business.findById(req.user.businessId);
    if (business) {
      business.members = business.members.filter(m => m.user.toString() !== req.user._id.toString());
      await business.save();
    }

    await User.findByIdAndUpdate(req.user._id, { businessId: null, businessRole: null });

    res.json({ success: true, message: 'You have left the business' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { createBusiness, getMyBusiness, inviteStaff, assignRole, removeStaff, leaveBusiness };
