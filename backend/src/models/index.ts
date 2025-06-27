import sequelize from '../config/database';
import User from './User';
import Product from './Product';
import Quotation from './Quotation';
import QuotationItem from './QuotationItem';

// Set up associations
User.hasMany(Quotation, { foreignKey: 'userId', as: 'quotations' });
Quotation.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Quotation.hasMany(QuotationItem, { foreignKey: 'quotationId', as: 'items' });
QuotationItem.belongsTo(Quotation, { foreignKey: 'quotationId', as: 'quotation' });

Product.hasMany(QuotationItem, { foreignKey: 'productId', as: 'quotationItems' });
QuotationItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

const models = {
  User,
  Product,
  Quotation,
  QuotationItem,
  sequelize,
};

export const syncDatabase = async (force: boolean = false): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    await sequelize.sync({ force });
    console.log('Database synchronized successfully.');
    
    if (force) {
      await seedDatabase();
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

const seedDatabase = async (): Promise<void> => {
  console.log('Seeding database...');
  
  // Create admin user
  await User.create({
    email: 'admin@crescebr.com',
    password: 'admin123',
    cpf: '123.456.789-00',
    address: 'Rua Principal, 123, Cascavel, PR',
    role: 'admin',
  });

  // Create sample customer
  await User.create({
    email: 'cliente@teste.com',
    password: 'cliente123',
    cpf: '987.654.321-00',
    address: 'Av. Brasil, 456, Foz do Iguaçu, PR',
    role: 'customer',
  });

  // Create sample products
  const sampleProducts = [
    {
      name: 'Equipamento Industrial XYZ',
      description: 'Equipamento de alta qualidade para uso industrial com garantia de 2 anos.',
      price: 15000.00,
      imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158',
      category: 'Equipamentos',
    },
    {
      name: 'Ferramenta Profissional ABC',
      description: 'Ferramenta durável e eficiente para trabalhos pesados.',
      price: 2500.00,
      imageUrl: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407',
      category: 'Ferramentas',
    },
    {
      name: 'Material de Construção Premium',
      description: 'Material de alta qualidade para construção civil.',
      price: 850.00,
      imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd',
      category: 'Construção',
    },
    {
      name: 'Sistema de Automação',
      description: 'Sistema completo de automação industrial com interface intuitiva.',
      price: 45000.00,
      imageUrl: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837',
      category: 'Automação',
    },
  ];

  for (const product of sampleProducts) {
    await Product.create(product);
  }

  console.log('Database seeded successfully.');
};

export default models;