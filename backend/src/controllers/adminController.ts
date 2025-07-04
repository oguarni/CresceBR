import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import User from '../models/User';
import { asyncHandler } from '../middleware/errorHandler';

export const getAllPendingCompanies = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const companies = await User.findAll({
    where: {
      role: 'supplier',
      status: 'pending'
    }
  });
  res.status(200).json({ success: true, data: companies });
});

export const verifyCompany = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  const { status } = req.body;

  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status provided' });
  }

  const user = await User.findOne({ where: { id: userId, role: 'supplier' } });

  if (!user) {
    return res.status(404).json({ success: false, error: 'Supplier not found' });
  }

  user.status = status;
  await user.save();

  res.status(200).json({ success: true, data: user });
});
