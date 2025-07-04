import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Order from './Order';
import User from './User';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface OrderStatusHistoryAttributes {
  id: number;
  orderId: string;
  fromStatus?: OrderStatus;
  toStatus: OrderStatus;
  changedBy: number;
  notes?: string;
  createdAt?: Date;
}

interface OrderStatusHistoryCreationAttributes
  extends Optional<OrderStatusHistoryAttributes, 'id' | 'fromStatus' | 'notes' | 'createdAt'> {}

class OrderStatusHistory
  extends Model<OrderStatusHistoryAttributes, OrderStatusHistoryCreationAttributes>
  implements OrderStatusHistoryAttributes
{
  public id!: number;
  public orderId!: string;
  public fromStatus?: OrderStatus;
  public toStatus!: OrderStatus;
  public changedBy!: number;
  public notes?: string;
  public readonly createdAt!: Date;
}

OrderStatusHistory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Order,
        key: 'id',
      },
    },
    fromStatus: {
      type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled'),
      allowNull: true,
    },
    toStatus: {
      type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled'),
      allowNull: false,
    },
    changedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'order_status_history',
    timestamps: false,
    createdAt: 'createdAt',
    updatedAt: false,
  }
);

export default OrderStatusHistory;
