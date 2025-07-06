import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface QuotationAttributes {
  id: number;
  companyId: number;
  status: 'pending' | 'processed' | 'completed' | 'rejected';
  adminNotes: string | null;
  totalAmount?: number;
  validUntil?: Date;
  requestedDeliveryDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface QuotationCreationAttributes
  extends Optional<
    QuotationAttributes,
    | 'id'
    | 'adminNotes'
    | 'totalAmount'
    | 'validUntil'
    | 'requestedDeliveryDate'
    | 'createdAt'
    | 'updatedAt'
  > {}

class Quotation
  extends Model<QuotationAttributes, QuotationCreationAttributes>
  implements QuotationAttributes
{
  public id!: number;
  public companyId!: number;
  public status!: 'pending' | 'processed' | 'completed' | 'rejected';
  public adminNotes!: string | null;
  public totalAmount?: number;
  public validUntil?: Date;
  public requestedDeliveryDate?: Date;
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
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
      comment: 'Reference to the company that requested the quotation',
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
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Total calculated amount for the quotation',
    },
    validUntil: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date until which the quotation is valid',
    },
    requestedDeliveryDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Requested delivery date by the buyer',
    },
  },
  {
    sequelize,
    tableName: 'quotations',
    timestamps: true,
  }
);

export default Quotation;
