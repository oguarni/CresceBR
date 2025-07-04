import { DataTypes, Model, Optional, UUIDV4 } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Quotation from './Quotation';

interface OrderAttributes {
  id: string;
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  userId: number;
  quotationId: number;
  totalAmount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface OrderCreationAttributes extends Optional<OrderAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}

class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  public id!: string;
  public status!: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  public userId!: number;
  public quotationId!: number;
  public totalAmount!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      primaryKey: true,
    },
    status: {
      type: DataTypes.ENUM('processing', 'shipped', 'delivered', 'cancelled'),
      allowNull: false,
      defaultValue: 'processing',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    quotationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Quotation,
        key: 'id',
      },
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'orders',
    timestamps: true,
  }
);

export default Order;
