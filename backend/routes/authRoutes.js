const express = require('express');
const router = express.Router();
const { registerUser, confirmUser, resendCode, loginUser, forgotPassword, confirmForgotPassword, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/confirm', confirmUser);
router.post('/resend-code', resendCode);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/confirm-forgot-password', confirmForgotPassword);
router.get('/me', protect, getMe);

module.exports = router;
