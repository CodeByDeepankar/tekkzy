const express = require('express');
const router = express.Router();
const { registerUser, confirmUser, resendCode, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/confirm', confirmUser);
router.post('/resend-code', resendCode);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

module.exports = router;
