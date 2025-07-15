import express from 'express';
import {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  toggleFeatured,
  incrementSubmissions,
  getPropertyTypeStats
} from '../controllers/propertyController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', getProperties);
router.get('/stats/types', getPropertyTypeStats);
router.get('/:id', getPropertyById);
router.post('/:id/submit', incrementSubmissions);

// Protected routes (admin only)
router.post('/', authenticateToken, createProperty);
router.put('/:id', authenticateToken, updateProperty);
router.delete('/:id', authenticateToken, deleteProperty);
router.patch('/:id/featured', authenticateToken, toggleFeatured);

export default router;

