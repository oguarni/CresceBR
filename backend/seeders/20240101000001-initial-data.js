'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Hash passwords
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const customerPasswordHash = await bcrypt.hash('cliente123', 10);

    // Create admin and customer users
    await queryInterface.bulkInsert('users', [
      {
        email: 'admin@crescebr.com',
        password: adminPasswordHash,
        cpf: '123.456.789-00',
        address: 'Rua Principal, 123, Cascavel, PR',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'cliente@teste.com',
        password: customerPasswordHash,
        cpf: '987.654.321-00',
        address: 'Av. Brasil, 456, Foz do Iguaçu, PR',
        role: 'customer',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Create sample products
    await queryInterface.bulkInsert('products', [
      {
        name: 'Equipamento Industrial XYZ',
        description: 'Equipamento de alta qualidade para uso industrial com garantia de 2 anos.',
        price: 15000.00,
        imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158',
        category: 'Equipamentos',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Ferramenta Profissional ABC',
        description: 'Ferramenta durável e eficiente para trabalhos pesados.',
        price: 2500.00,
        imageUrl: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407',
        category: 'Ferramentas',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Material de Construção Premium',
        description: 'Material de alta qualidade para construção civil.',
        price: 850.00,
        imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd',
        category: 'Construção',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Sistema de Automação',
        description: 'Sistema completo de automação industrial com interface intuitiva.',
        price: 45000.00,
        imageUrl: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837',
        category: 'Automação',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('products', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};