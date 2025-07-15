import { Request, Response } from 'express';
import Admin from '../models/Admin';
import { generateToken } from '../middleware/auth';

// Admin login
export const login = async (req: Request, res: Response): Promise<void> => {

  try {
    const { username, password, rememberMe } = req.body;

    if (!username || !password) {
      res.status(400).json({ message: 'Username and password are required' });
      return;
    }

    // Check if admin exists
    let admin = await Admin.findOne({ username: username.toLowerCase() });

    // If no admin exists, create default admin
    if (!admin) {
      const defaultUsername = process.env.ADMIN_USERNAME || 'admin';
      const defaultPassword = process.env.ADMIN_PASSWORD || 'password';

      if (username.toLowerCase() === defaultUsername.toLowerCase()) {
        admin = new Admin({
          username: defaultUsername.toLowerCase(),
          password: defaultPassword
        });
        await admin.save();
      } else {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate token
    const token = generateToken((admin._id as any).toString());

    // Set cookie options based on rememberMe
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // 7 days or 1 day
    };

    res.cookie('adminToken', token, cookieOptions);

    res.json({
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        lastLogin: admin.lastLogin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin logout
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    res.clearCookie('adminToken');
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check authentication status
export const checkAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies.adminToken || req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    // Token validation is handled by the auth middleware
    // If we reach here, the token is valid
    res.json({ message: 'Authenticated', isAuthenticated: true });
  } catch (error) {
    console.error('Check auth error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

