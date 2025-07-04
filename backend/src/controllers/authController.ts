import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import { generateToken } from '../utils/jwt';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { RegisterRequest, LoginRequest, AuthResponse } from '../types';
import { CNPJService } from '../services/cnpjService';

export const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('cpf')
    .isLength({ min: 11, max: 14 })
    .withMessage('CPF must be between 11 and 14 characters'),
  body('address').notEmpty().withMessage('Address is required'),
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const supplierRegisterValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('cpf')
    .isLength({ min: 11, max: 14 })
    .withMessage('CPF must be between 11 and 14 characters'),
  body('address').notEmpty().withMessage('Address is required'),
  body('companyName').notEmpty().withMessage('Company name is required'),
  body('cnpj')
    .isLength({ min: 14, max: 18 })
    .withMessage('CNPJ must be between 14 and 18 characters'),
];

export const register = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }

  const { email, password, cpf, address }: RegisterRequest = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    where: {
      email,
    },
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: 'User with this email already exists',
    });
  }

  // Check if CPF already exists
  const existingCpf = await User.findOne({
    where: {
      cpf,
    },
  });

  if (existingCpf) {
    return res.status(400).json({
      success: false,
      error: 'User with this CPF already exists',
    });
  }

  // Create new user
  const user = await User.create({
    email,
    password,
    cpf,
    address,
    role: 'customer',
  });

  // Generate token
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  const response: AuthResponse = {
    token,
    user: {
      id: user.id,
      email: user.email,
      cpf: user.cpf,
      address: user.address,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: response,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }

  const { email, password }: LoginRequest = req.body;

  // Find user by email
  const user = await User.findOne({
    where: {
      email,
    },
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password',
    });
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password',
    });
  }

  // Generate token
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  const response: AuthResponse = {
    token,
    user: {
      id: user.id,
      email: user.email,
      cpf: user.cpf,
      address: user.address,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: response,
  });
});

export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  // Find user by ID from token
  const user = await User.findByPk(req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Profile retrieved successfully',
    data: {
      user: {
        id: user.id,
        email: user.email,
        cpf: user.cpf,
        address: user.address,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    },
  });
});

export const registerSupplier = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }

  const { email, password, cpf, address, companyName, cnpj } = req.body;

  const existingUser = await User.findOne({
    where: {
      email,
    },
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: 'User with this email already exists',
    });
  }

  const existingCpf = await User.findOne({
    where: {
      cpf,
    },
  });

  if (existingCpf) {
    return res.status(400).json({
      success: false,
      error: 'User with this CPF already exists',
    });
  }

  const existingCnpj = await User.findOne({
    where: {
      cnpj,
    },
  });

  if (existingCnpj) {
    return res.status(400).json({
      success: false,
      error: 'Company with this CNPJ already exists',
    });
  }

  const cnpjValidation = await CNPJService.validateCNPJWithAPI(cnpj);
  if (!cnpjValidation.valid) {
    return res.status(400).json({
      success: false,
      error: cnpjValidation.error || 'Invalid CNPJ provided',
    });
  }

  const user = await User.create({
    email,
    password,
    cpf,
    address: cnpjValidation.address || address,
    companyName: cnpjValidation.companyName || companyName,
    cnpj: CNPJService.formatCNPJ(cnpj),
    role: 'supplier',
    status: 'pending',
  });

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  const response: AuthResponse = {
    token,
    user: {
      id: user.id,
      email: user.email,
      cpf: user.cpf,
      address: user.address,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };

  res.status(201).json({
    success: true,
    message: 'Supplier registered successfully. Account pending approval.',
    data: response,
    cnpjValidation: {
      companyName: cnpjValidation.companyName,
      fantasyName: cnpjValidation.fantasyName,
      city: cnpjValidation.city,
      state: cnpjValidation.state,
    },
  });
});
