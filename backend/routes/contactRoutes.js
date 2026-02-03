const express = require('express');
const router = express.Router();
const {
    getContacts,
    getUserContacts,
    createContact,
    deleteContact
} = require('../controllers/contactController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getContacts);
router.get('/mine', protect, getUserContacts);
router.post('/', protect, createContact);
router.delete('/:id', protect, deleteContact);

module.exports = router;
