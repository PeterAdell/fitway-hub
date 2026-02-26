import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existingUser = UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = UserModel.create(email, hashedPassword);
    
    // Generate token
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '1d' });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = UserModel.findByEmail(email);
    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '1d' });

    // Generate remember token if requested
    if (rememberMe) {
      const rememberToken = jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '30d' });
      UserModel.setRememberToken(user.id, rememberToken);
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      token,
      rememberToken: rememberMe ? jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '30d' }) : undefined,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = UserModel.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not
      return res.json({ message: 'If email exists, reset link has been sent' });
    }

    // Generate reset token (valid for 1 hour)
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const resetToken = jwt.sign({ id: user.id, email: user.email, reset: true }, secret, { expiresIn: '1h' });
    
    UserModel.setResetToken(user.id, resetToken, 3600000); // 1 hour

    // In production, send email with reset link:
    // const resetUrl = `https://yourapp.com/reset-password?token=${resetToken}`;
    // await sendEmail(email, 'Password Reset', `Click here to reset: ${resetUrl}`);

    // For testing, return the token directly
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return res.json({ 
      message: 'Password reset token generated', 
      resetToken,  // For testing only - in prod, only send via email
      resetUrl: `/auth/reset-password?token=${resetToken}` 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    // Accept either `token` or `resetToken` from clients
    const token = req.body.token || req.body.resetToken;
    const newPassword = req.body.newPassword;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    const user = UserModel.findByResetToken(token);
    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset token
    UserModel.updatePassword(user.id, hashedPassword);

    return res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const loginWithRememberToken = async (req: Request, res: Response) => {
  try {
    const { rememberToken } = req.body;

    if (!rememberToken) {
      return res.status(400).json({ message: 'Remember token is required' });
    }

    const user = UserModel.findByRememberToken(rememberToken);
    if (!user) {
      return res.status(401).json({ message: 'Invalid remember token' });
    }

    // Generate new short-lived token
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '1d' });

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Auto-login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Auto-login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { height, weight, gender, name, avatar } = req.body;

    const result = UserModel.updateProfile(userId, { height, weight, gender, name, avatar });
    if (result === null) return res.status(400).json({ message: 'No profile fields provided' });

    const updated = UserModel.findById(userId);
    const { password: _, ...userWithoutPassword } = updated || {} as any;
    res.json({ message: 'Profile updated', user: userWithoutPassword });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addOfflineSteps = async (req: Request, res: Response) => {
  try {
    const { steps } = req.body;
    const userId = req.user?.id;

    if (!userId || !steps) {
      return res.status(400).json({ message: 'User ID and steps are required' });
    }

    UserModel.addOfflineSteps(userId, steps);

    res.json({ message: 'Offline steps synced', steps });
  } catch (error) {
    console.error('Offline steps error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}
