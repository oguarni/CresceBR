'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'status', {
      type: Sequelize.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    });
    await queryInterface.addColumn('users', 'companyName', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'cnpj', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });
    await queryInterface.changeColumn('users', 'role', {
        type: Sequelize.ENUM('customer', 'admin', 'supplier'),
        allowNull: false,
        defaultValue: 'customer',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'status');
    await queryInterface.removeColumn('users', 'companyName');
    await queryInterface.removeColumn('users', 'cnpj');
    await queryInterface.changeColumn('users', 'role', {
        type: Sequelize.ENUM('customer', 'admin'),
        allowNull: false,
        defaultValue: 'customer',
    });
  }
};