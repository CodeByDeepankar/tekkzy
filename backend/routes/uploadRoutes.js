const express = require('express');
const router = express.Router();
const { createPresignedUpload } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');

router.post('/presign', protect, createPresignedUpload);

module.exports = router;
