import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Order from './Order';

interface RatingAttributes {
  id: number;
  supplierId: number;
  buyerId: number;
  orderId?: string;
  score: number;
  comment?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface RatingCreationAttributes
  extends Optional<RatingAttributes, 'id' | 'orderId' | 'comment' | 'createdAt' | 'updatedAt'> {}

class Rating extends Model<RatingAttributes, RatingCreationAttributes> implements RatingAttributes {
  public id!: number;
  public supplierId!: number;
  public buyerId!: number;
  public orderId?: string;
  public score!: number;
  public comment?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Rating.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    supplierId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    buyerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: Order,
        key: 'id',
      },
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'ratings',
    timestamps: true,
  }
);

export default Rating;
