import Quotation from '../models/Quotation';
import QuotationItem from '../models/QuotationItem';
import Product from '../models/Product';
import User from '../models/User';

const QUOTATION_INCLUDES = {
  withItems: [
    {
      model: QuotationItem,
      as: 'items',
      include: [{ model: Product, as: 'product' }],
    },
  ],
  withItemsAndUser: [
    {
      model: QuotationItem,
      as: 'items',
      include: [{ model: Product, as: 'product' }],
    },
    {
      model: User,
      as: 'user',
      attributes: ['id', 'email', 'cpf', 'address', 'role'],
    },
  ],
};

export const quotationRepository = {
  findById: (id: number) => Quotation.findByPk(id),

  findByIdWithItems: (id: number) =>
    Quotation.findByPk(id, { include: QUOTATION_INCLUDES.withItems }),

  findByIdWithItemsAndUser: (id: number) =>
    Quotation.findByPk(id, { include: QUOTATION_INCLUDES.withItemsAndUser }),

  findAllForCompany: (companyId: number) =>
    Quotation.findAll({
      where: { companyId },
      include: QUOTATION_INCLUDES.withItems,
      order: [['createdAt', 'DESC']],
    }),

  findAll: () =>
    Quotation.findAll({
      include: QUOTATION_INCLUDES.withItemsAndUser,
      order: [['createdAt', 'DESC']],
    }),

  create: (data: { companyId: number; status: 'pending' | 'processed' | 'completed' | 'rejected'; adminNotes: string | null }) =>
    Quotation.create(data),

  update: (quotation: Quotation, data: Partial<{ status: 'pending' | 'processed' | 'completed' | 'rejected'; adminNotes: string | null }>) =>
    quotation.update(data),
};
