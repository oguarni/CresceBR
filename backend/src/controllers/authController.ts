import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import { generateToken } from '../utils/jwt';
import { asyncHandler } from '../middleware/errorHandler';
import { RegisterRequest, LoginRequest, AuthResponse } from '../../../shared/types';

export const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('cpf').isLength({ min: 11, max: 14 }).withMessage('CPF must be between 11 and 14 characters'),
  body('address').notEmpty().withMessage('Address is required'),
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
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