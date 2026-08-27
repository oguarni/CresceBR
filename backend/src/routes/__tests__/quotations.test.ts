import express, { NextFunction, Request, Response } from 'express';
import request from 'supertest';

jest.mock('../../middleware/auth', () => ({
  authenticateJWT: (req: Request, _res: Response, next: NextFunction) => {
    Object.assign(req, { user: { id: 1, role: 'admin' } });
    next();
  },
}));

jest.mock('../../middleware/rbac', () => ({
  requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

jest.mock('../../middleware/rateLimiting', () => ({
  generalRateLimit: (_req: Request, _res: Response, next: NextFunction) => next(),
  quoteRateLimit: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

jest.mock('../../controllers/quotationsController', () => {
  const noContent = (_req: Request, res: Response) => res.sendStatus(204);

  return {
    createQuotation: noContent,
    getCustomerQuotations: noContent,
    getSupplierQuotations: noContent,
    getQuotationById: noContent,
    getAllQuotations: noContent,
    updateQuotation: jest.fn((_req: Request, res: Response) => {
      res.status(200).json({ success: true });
    }),
    calculateQuote: noContent,
    getQuotationCalculations: noContent,
    processQuotationWithCalculations: noContent,
    getMultipleSupplierQuotes: noContent,
  };
});

import { updateQuotation } from '../../controllers/quotationsController';
import quotationsRouter from '../quotations';

describe('quotation routes', () => {
  const app = express();
  app.use(express.json());
  app.use('/quotations', quotationsRouter);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('routes admin quotation updates to the update controller', async () => {
    await request(app)
      .put('/quotations/admin/42')
      .send({ status: 'processed', adminNotes: 'Reviewed' })
      .expect(200, { success: true });

    expect(updateQuotation).toHaveBeenCalledTimes(1);
  });
});
