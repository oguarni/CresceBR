'use strict';
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const salt = await bcrypt.genSalt(10);

    // --- Create User IDs ---
    const adminId = uuidv4();
    const supplierId = uuidv4();
    const buyerId = uuidv4();

    // --- Users (Companies) ---
    await queryInterface.bulkInsert('Users', [
      {
        id: adminId,
        email: 'admin@crescebr.com',
        password: await bcrypt.hash('admin123', salt),
        companyName: 'CresceBR Admin',
        cnpj: '00000000000000', // CNPJ fictício para admin
        role: 'admin',
        status: 'approved',
        street: 'Rua da Administração',
        number: '100',
        complement: 'Sala 1',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01000-000',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: supplierId,
        email: 'supplier@agro.com',
        password: await bcrypt.hash('supplier123', salt),
        companyName: 'AgroTech Fornecedora',
        cnpj: '11222333000144', // CNPJ válido para testes
        role: 'supplier',
        status: 'approved',
        street: 'Avenida do Campo',
        number: '500',
        complement: '',
        neighborhood: 'Zona Rural',
        city: 'Ribeirão Preto',
        state: 'SP',
        zipCode: '14000-000',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: buyerId,
        email: 'buyer@construtora.com',
        password: await bcrypt.hash('buyer123', salt),
        companyName: 'Construtora Edifica',
        cnpj: '44555666000177', // CNPJ válido para testes
        role: 'buyer',
        status: 'approved',
        street: 'Rua das Obras',
        number: '1234',
        complement: 'Bloco A',
        neighborhood: 'Bairro Industrial',
        city: 'Belo Horizonte',
        state: 'MG',
        zipCode: '30000-000',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});

    // --- Products ---
    await queryInterface.bulkInsert('Products', [
      {
        id: uuidv4(),
        name: 'Semente de Soja Transgênica',
        description: 'Saca de 20kg de semente de soja de alta produtividade, resistente a pragas.',
        price: 250.00,
        stock: 1000,
        companyId: supplierId, // Associado à AgroTech
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Fertilizante NPK 10-10-10',
        description: 'Fertilizante balanceado para diversas culturas. Embalagem de 50kg.',
        price: 180.50,
        stock: 500,
        companyId: supplierId, // Associado à AgroTech
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Products', null, {});
    await queryInterface.bulkDelete('Users', null, {});
  }
};
