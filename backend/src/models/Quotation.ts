import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface QuotationAttributes {
  id: number;
  userId: number;
  status: 'pending' | 'processed' | 'completed' | 'rejected';
  adminNotes: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface QuotationCreationAttributes extends Optional<QuotationAttributes, 'id' | 'adminNotes' | 'createdAt' | 'updatedAt'> {}

class Quotation extends Model<QuotationAttributes, QuotationCreationAttributes> implements QuotationAttributes {
  public id!: number;
  public userId!: number;
  public status!: 'pending' | 'processed' | 'completed' | 'rejected';
  public adminNotes!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Quotation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'processed', 'completed', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    adminNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'quotations',
    timestamps: true,
  }
);

export default Quotation;