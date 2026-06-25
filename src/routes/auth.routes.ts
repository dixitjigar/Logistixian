import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize, validate } from '../middleware/auth';
import { validate as validateRequest } from '../middleware/validation';
import { registerValidation, loginValidation } from '../services/validation.service';
import { UserService } from '../services/user.service';
import { CompanyService } from '../services/company.service';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../types';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
  '/register',
  validateRequest(registerValidation),
  async (req, res) => {
    try {
      const { email, password, firstName, lastName, role, companyName } = req.body;

      let companyId: string | undefined;

      // Create company if provided
      if (companyName) {
        const company = await CompanyService.createCompany({
          name: companyName,
          type: role as UserRole.BUYER | UserRole.SUPPLIER,
        });
        companyId = company.id;
      }

      // Create user
      const user = await UserService.createUser({
        email,
        password,
        firstName,
        lastName,
        role: role as UserRole,
        companyId,
      });

      // Generate token
      const token = AuthService.generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      });

      res.status(201).json({
        message: 'User registered successfully',
        data: {
          user,
          token,
        },
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post(
  '/login',
  validateRequest(loginValidation),
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await UserService.getUserByEmail(email);

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValid = await AuthService.verifyPassword(password, user.passwordHash);

      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = AuthService.generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      });

      res.json({
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            companyId: user.companyId,
          },
          token,
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, async (req: any, res) => {
  try {
    const user = await UserService.getUserById(req.user.id);
    res.json({ data: user });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put(
  '/profile',
  authenticate,
  body('firstName').optional().trim().isLength({ max: 50 }),
  body('lastName').optional().trim().isLength({ max: 50 }),
  validate,
  async (req: any, res) => {
    try {
      const { firstName, lastName } = req.body;
      const user = await UserService.updateUser(req.user.id, { firstName, lastName });
      res.json({ message: 'Profile updated', data: user });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

export default router;
