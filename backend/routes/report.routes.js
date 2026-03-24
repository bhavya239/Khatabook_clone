const express = require('express');
const router = express.Router();
const { getProfitLossReport } = require('../controllers/report.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/profit-loss', getProfitLossReport);

module.exports = router;
