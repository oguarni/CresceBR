import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface PricingTier {
  minQuantity: number;
  maxQuantity: number | null;
  discount: number;
}

interface ProductAttributes {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  supplierId?: number;
  tierPricing?: PricingTier[];
  specifications?: Record<string, any>;
  unitPrice?: number;
  minimumOrderQuantity?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProductCreationAttributes
  extends Optional<
    ProductAttributes,
    | 'id'
    | 'supplierId'
    | 'tierPricing'
    | 'specifications'
    | 'unitPrice'
    | 'minimumOrderQuantity'
    | 'createdAt'
    | 'updatedAt'
  > {}

class Product
  extends Model<ProductAttributes, ProductCreationAttributes>
  implements ProductAttributes
{
  public id!: number;
  public name!: string;
  public description!: string;
  public price!: number;
  public imageUrl!: string;
  public category!: string;
  public supplierId?: number;
  public tierPricing?: PricingTier[];
  public specifications?: Record<string, any>;
  public unitPrice?: number;
  public minimumOrderQuantity?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Product.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0,
      },
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        isUrl: true,
      },
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100],
      },
    },
    supplierId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    tierPricing: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'JSON field for quantity-based pricing tiers',
    },
    specifications: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'JSON field for technical specifications and product details',
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Price per unit for bulk ordering',
    },
    minimumOrderQuantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Minimum quantity required for orders',
    },
  },
  {
    sequelize,
    tableName: 'products',
    timestamps: true,
  }
);

export default Product;
