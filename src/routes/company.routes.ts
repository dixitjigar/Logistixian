import { Router } from 'express';
import { body, query } from 'express-validator';
import { authenticate, authorize, validate } from '../middleware/auth';
import { validate as validateRequest } from '../middleware/validation';
import { CompanyService } from '../services/company.service';
import { createCompanyValidation } from '../services/validation.service';
import { UserRole } from '../types';

const router = Router();

/**
 * POST /api/companies
 * Create a new company (Admin only)
 */
router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest(createCompanyValidation),
  async (req, res) => {
    try {
      const { name, type, industry, country, website, description } = req.body;

      const company = await CompanyService.createCompany({
        name,
        type: type as UserRole.BUYER | UserRole.SUPPLIER,
        industry,
        country,
        website,
        description,
      });

      res.status(201).json({ message: 'Company created', data: company });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * GET /api/companies/search
 * Search companies with filters
 */
router.get(
  '/search',
  authenticate,
  query('search').optional().trim(),
  query('type').optional().isIn(['BUYER', 'SUPPLIER']),
  query('country').optional().trim(),
  query('industry').optional().trim(),
  query('verified').optional().isBoolean(),
  validate,
  async (req: any, res) => {
    try {
      const { search, type, country, industry, verified } = req.query;

      const companies = await CompanyService.searchCompanies({
        search,
        type: type as UserRole.BUYER | UserRole.SUPPLIER,
        country,
        industry,
        verified: verified === 'true' ? true : verified === 'false' ? false : undefined,
      });

      res.json({ data: companies });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/companies/:id
 * Get company by ID
 */
router.get('/:id', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const company = await CompanyService.getCompanyById(id);
    res.json({ data: company });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

/**
 * PUT /api/companies/:id
 * Update company (Owner or Admin)
 */
router.put(
  '/:id',
  authenticate,
  body('name').optional().trim().isLength({ max: 100 }),
  body('industry').optional().trim(),
  body('country').optional().trim(),
  body('website').optional().trim().isURL(),
  body('description').optional().trim().isLength({ max: 1000 }),
  validate,
  async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Check permissions
      const company = await CompanyService.getCompanyById(id);
      if (
        req.user.role !== UserRole.ADMIN &&
        company.users.every((u: any) => u.id !== req.user.id)
      ) {
        return res.status(403).json({ error: 'Not authorized to update this company' });
      }

      const updated = await CompanyService.updateCompany(id, updates);
      res.json({ message: 'Company updated', data: updated });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * POST /api/companies/:id/verify
 * Verify a company (Admin only)
 */
router.post(
  '/:id/verify',
  authenticate,
  authorize(UserRole.ADMIN),
  body('verified').isBoolean(),
  validate,
  async (req: any, res) => {
    try {
      const { id } = req.params;
      const { verified } = req.body;

      const company = await CompanyService.verifyCompany(id, verified);
      res.json({ message: `Company ${verified ? 'verified' : 'unverified'}`, data: company });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

export default router;
