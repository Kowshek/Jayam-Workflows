const express = require('express');
const { body } = require('express-validator');
const {
  createRequest,
  getMyRequests,
  getAllRequests,
  getRequestById,
  updateStatus,
  getRequestLogs,
  getStats,
} = require('../controllers/requestController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Stats for dashboard cards
router.get('/stats', getStats);

// User's own requests
router.get('/mine', requireRole('user', 'manager', 'admin'), getMyRequests);

// All requests (manager + admin)
router.get('/', requireRole('manager', 'admin'), getAllRequests);

// Create new request (users only)
router.post(
  '/',
  requireRole('user'),
  [
    body('title')
      .trim()
      .notEmpty().withMessage('Title is required')
      .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
    body('description')
      .trim()
      .notEmpty().withMessage('Description is required'),
    body('category')
      .trim()
      .notEmpty().withMessage('Category is required'),
    body('priority')
      .isIn(['Low', 'Medium', 'High', 'Urgent'])
      .withMessage('Priority must be Low, Medium, High, or Urgent'),
  ],
  createRequest
);

// Single request detail
router.get('/:id', getRequestById);

// Update status (workflow action)
router.patch(
  '/:id/status',
  [
    body('status').notEmpty().withMessage('New status is required'),
    body('comment').optional().isLength({ max: 500 }).withMessage('Comment too long'),
  ],
  updateStatus
);

// Action log for a request
router.get('/:id/logs', getRequestLogs);

module.exports = router;
