const express = require('express');
const router = express.Router();
const { register, login, verifyOTP, completeSetup } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.put('/complete-setup', protect, completeSetup);

module.exports = router;

