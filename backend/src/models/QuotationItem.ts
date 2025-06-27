import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Quotation from './Quotation';
import Product from './Product';

interface QuotationItemAttributes {
  id: number;
  quotationId: number;
  productId: number;
  quantity: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface QuotationItemCreationAttributes extends Optional<QuotationItemAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class QuotationItem extends Model<QuotationItemAttributes, QuotationItemCreationAttributes> implements QuotationItemAttributes {
  public id!: number;
  public quotationId!: number;
  public productId!: number;
  public quantity!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

QuotationItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    quotationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Quotation,
        key: 'id',
      },
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Product,
        key: 'id',
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
  },
  {
    sequelize,
    tableName: 'quotation_items',
    timestamps: true,
  }
);

export default QuotationItem;