const Contact = require('../models/Contact');

// ──────────────────────────────────────────────
// @route   GET /api/contacts
// @desc    Get all contacts for logged-in user
// @access  Private
// ──────────────────────────────────────────────
const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({ user: req.user._id, isActive: true })
      .sort({ updatedAt: -1 });
    res.json({ success: true, count: contacts.length, contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// @route   POST /api/contacts
// @desc    Add a new contact
// @access  Private
// ──────────────────────────────────────────────
const addContact = async (req, res) => {
  try {
    const { name, phone, notes } = req.body;

    // Check for duplicate: same user + same phone
    const existing = await Contact.findOne({ user: req.user._id, phone });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Contact with this phone already exists' });
    }

    const contact = await Contact.create({ user: req.user._id, name, phone, notes });

    res.status(201).json({ success: true, message: 'Contact added', contact });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// @route   GET /api/contacts/:id
// @desc    Get a single contact
// @access  Private
// ──────────────────────────────────────────────
const getContact = async (req, res) => {
  try {
    const contact = await Contact.findOne({ _id: req.params.id, user: req.user._id });
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    res.json({ success: true, contact });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// @route   PUT /api/contacts/:id
// @desc    Update a contact
// @access  Private
// ──────────────────────────────────────────────
const updateContact = async (req, res) => {
  try {
    const { name, phone, notes } = req.body;

    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { name, phone, notes },
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    res.json({ success: true, message: 'Contact updated', contact });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// @route   DELETE /api/contacts/:id
// @desc    Soft-delete a contact
// @access  Private
// ──────────────────────────────────────────────
const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isActive: false },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    res.json({ success: true, message: 'Contact deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getContacts, addContact, getContact, updateContact, deleteContact };
