import { body } from 'express-validator';

export const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name must be less than 50 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 50 })
    .withMessage('Last name must be less than 50 characters'),
  body('role')
    .isIn(['BUYER', 'SUPPLIER'])
    .withMessage('Role must be either BUYER or SUPPLIER'),
  body('companyName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Company name is required if role is provided')
    .isLength({ max: 100 })
    .withMessage('Company name must be less than 100 characters'),
];

export const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export const createCompanyValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Company name is required')
    .isLength({ max: 100 })
    .withMessage('Company name must be less than 100 characters'),
  body('type')
    .isIn(['BUYER', 'SUPPLIER'])
    .withMessage('Company type must be either BUYER or SUPPLIER'),
  body('industry')
    .optional()
    .trim()
    .isLength({ max: 50 }),
  body('country')
    .optional()
    .trim()
    .isLength({ max: 50 }),
  body('website')
    .optional()
    .trim()
    .isURL()
    .withMessage('Website must be a valid URL'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }),
];
