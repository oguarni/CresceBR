import sequelize from '../config/database';
import User from './User';
import Product from './Product';
import Quotation from './Quotation';
import QuotationItem from './QuotationItem';
import Order from './Order';

// Set up associations
// User (Company) <-> Quotation associations
User.hasMany(Quotation, { foreignKey: 'companyId', as: 'quotations' });
Quotation.belongsTo(User, { foreignKey: 'companyId', as: 'company' });

// User (Company) <-> Order associations
User.hasMany(Order, { foreignKey: 'companyId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'companyId', as: 'company' });

// User (Supplier) <-> Product associations
User.hasMany(Product, { foreignKey: 'supplierId', as: 'products' });
Product.belongsTo(User, { foreignKey: 'supplierId', as: 'supplier' });

// Order <-> Quotation associations
Quotation.hasMany(Order, { foreignKey: 'quotationId', as: 'orders' });
Order.belongsTo(Quotation, { foreignKey: 'quotationId', as: 'quotation' });

Quotation.hasMany(QuotationItem, { foreignKey: 'quotationId', as: 'items' });
QuotationItem.belongsTo(Quotation, { foreignKey: 'quotationId', as: 'quotation' });

Product.hasMany(QuotationItem, { foreignKey: 'productId', as: 'quotationItems' });
QuotationItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

const models = {
  User,
  Product,
  Quotation,
  QuotationItem,
  Order,
  sequelize,
};

export const syncDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    console.log('Use migrations to manage database schema changes: npx sequelize-cli db:migrate');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

export default models;
