'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    // Helper function to check if a column exists before adding it
    const columnExists = async (tableName, columnName) => {
      // describeTable is more reliable across different SQL dialects
      const tableInfo = await queryInterface.describeTable(tableName, { transaction });
      return !!tableInfo[columnName];
    };

    try {
      // --- Lista de colunas a serem adicionadas ---
      const columnsToAdd = [
        { name: 'companyName',  opts: { type: Sequelize.STRING, allowNull: true } },
        { name: 'cnpj',         opts: { type: Sequelize.STRING, allowNull: true, unique: true } },
        { name: 'street',       opts: { type: Sequelize.STRING, allowNull: true } },
        { name: 'number',       opts: { type: Sequelize.STRING, allowNull: true } },
        { name: 'complement',   opts: { type: Sequelize.STRING, allowNull: true } },
        { name: 'neighborhood', opts: { type: Sequelize.STRING, allowNull: true } },
        { name: 'city',         opts: { type: Sequelize.STRING, allowNull: true } },
        { name: 'state',        opts: { type: Sequelize.STRING, allowNull: true } },
        { name: 'zipCode',      opts: { type: Sequelize.STRING, allowNull: true } },
        { name: 'status',       opts: { type: Sequelize.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending', allowNull: false } }
      ];

      // --- Adiciona cada coluna SOMENTE SE ELA NÃO EXISTIR ---
      for (const col of columnsToAdd) {
        if (!(await columnExists('Users', col.name))) {
          await queryInterface.addColumn('Users', col.name, col.opts, { transaction });
        }
      }
      
      // --- Altera a coluna 'role' para incluir 'buyer' ---
      await queryInterface.changeColumn('Users', 'role', {
        type: Sequelize.ENUM('admin', 'supplier', 'buyer'),
        allowNull: false,
      }, { transaction });

      // --- Garante que a chave estrangeira em 'Products' seja UUID ---
      await queryInterface.changeColumn('Products', 'companyId', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      }, { transaction });

      console.log('User to Company model transformation migration completed successfully');
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Lógica para reverter as alterações
      await queryInterface.removeColumn('Users', 'companyName', { transaction });
      await queryInterface.removeColumn('Users', 'cnpj', { transaction });
      await queryInterface.removeColumn('Users', 'street', { transaction });
      await queryInterface.removeColumn('Users', 'number', { transaction });
      await queryInterface.removeColumn('Users', 'complement', { transaction });
      await queryInterface.removeColumn('Users', 'neighborhood', { transaction });
      await queryInterface.removeColumn('Users', 'city', { transaction });
      await queryInterface.removeColumn('Users', 'state', { transaction });
      await queryInterface.removeColumn('Users', 'zipCode', { transaction });
      await queryInterface.removeColumn('Users', 'status', { transaction });
      
      await queryInterface.changeColumn('Users', 'role', {
        type: Sequelize.ENUM('admin', 'supplier'),
        allowNull: false,
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};