import Product from '../models/Product';
import User from '../models/User';

export const productRepository = {
  findById: (id: number) => Product.findByPk(id),

  findByIdWithSupplier: (id: number) =>
    Product.findByPk(id, {
      include: [{ model: User, as: 'supplier', attributes: ['id', 'companyName', 'email'] }],
    }),

  findAllActive: () =>
    Product.findAll({
      where: { availability: ['in_stock', 'limited'] },
      include: [{ model: User, as: 'supplier', attributes: ['id', 'companyName'] }],
    }),

  findBySupplier: (supplierId: number) =>
    Product.findAll({ where: { supplierId } }),

  findByIds: (ids: number[]) =>
    Product.findAll({ where: { id: ids } }),
};
