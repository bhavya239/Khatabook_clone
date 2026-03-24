const express = require('express');
const router = express.Router();
const {
  createBusiness,
  getMyBusiness,
  inviteStaff,
  assignRole,
  removeStaff,
  leaveBusiness,
} = require('../controllers/business.controller');
const { protect } = require('../middleware/auth.middleware');

// All business routes require login
router.use(protect);

router.post('/create', createBusiness);
router.get('/me', getMyBusiness);
router.post('/invite', inviteStaff);
router.put('/role', assignRole);
router.delete('/remove/:userId', removeStaff);
router.delete('/leave', leaveBusiness);

module.exports = router;
