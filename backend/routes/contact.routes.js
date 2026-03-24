const express = require('express');
const router = express.Router();
const {
  getContacts, addContact, getContact, updateContact, deleteContact, getContactScores
} = require('../controllers/contact.controller');
const { protect } = require('../middleware/auth.middleware');
const { contactValidator } = require('../middleware/validate.middleware');

// All contact routes are protected
router.use(protect);

// Score explicitly listed before /:id path trap
router.get('/score', getContactScores);

router.route('/')
  .get(getContacts)
  .post(contactValidator, addContact);

router.route('/:id')
  .get(getContact)
  .put(contactValidator, updateContact)
  .delete(deleteContact);

module.exports = router;
