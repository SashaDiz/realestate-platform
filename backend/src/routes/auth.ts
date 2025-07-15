import express from 'express';
import { login, logout, checkAuth } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/check', authenticateToken, checkAuth);

export default router;

