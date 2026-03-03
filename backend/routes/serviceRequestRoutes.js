const express = require('express');
const router = express.Router();
const { protect, adminProtect } = require('../middleware/authMiddleware');
const {
    createRequest,
    getUserRequests,
    getRequestById,
    getAllRequests,
    updateRequestStatus,
    addAdminResponse,
    updateAdminNotes,
    deleteRequest,
} = require('../controllers/serviceRequestController');

// Client routes (authenticated users)
router.post('/', protect, createRequest);
router.get('/mine', protect, getUserRequests);

// Admin routes (must be admin group member)
router.get('/', protect, adminProtect, getAllRequests);

// Mixed access: owner or admin  
router.get('/:id', protect, getRequestById);

// Admin-only mutation routes
router.put('/:id/status', protect, adminProtect, updateRequestStatus);
router.put('/:id/response', protect, adminProtect, addAdminResponse);
router.put('/:id/notes', protect, adminProtect, updateAdminNotes);
router.delete('/:id', protect, adminProtect, deleteRequest);

module.exports = router;
