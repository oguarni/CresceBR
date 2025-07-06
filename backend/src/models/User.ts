import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';

interface UserAttributes {
  id: number;
  email: string;
  password: string;
  cpf: string;
  address: string;
  role: 'customer' | 'admin' | 'supplier';
  status: 'pending' | 'approved' | 'rejected';
  companyName: string;
  corporateName: string;
  cnpj: string;
  cnpjValidated: boolean;
  industrySector: string;
  companyType: 'buyer' | 'supplier' | 'both';
  averageRating?: number;
  totalRatings?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes
  extends Optional<
    UserAttributes,
    'id' | 'status' | 'cnpjValidated' | 'averageRating' | 'totalRatings' | 'createdAt' | 'updatedAt'
  > {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public email!: string;
  public password!: string;
  public cpf!: string;
  public address!: string;
  public role!: 'customer' | 'admin' | 'supplier';
  public status!: 'pending' | 'approved' | 'rejected';
  public companyName!: string;
  public corporateName!: string;
  public cnpj!: string;
  public cnpjValidated!: boolean;
  public industrySector!: string;
  public companyType!: 'buyer' | 'supplier' | 'both';
  public averageRating?: number;
  public totalRatings?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  public static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [6, 255],
      },
    },
    cpf: {
      type: DataTypes.STRING(14),
      allowNull: false,
      unique: true,
      validate: {
        len: [11, 14], // CPF can be with or without formatting
      },
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('customer', 'admin', 'supplier'),
      allowNull: false,
      defaultValue: 'customer',
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    companyName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 255],
      },
    },
    corporateName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 255],
      },
      comment: 'Legal corporate name for business registration',
    },
    cnpj: {
      type: DataTypes.STRING(18),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [14, 18],
      },
    },
    cnpjValidated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    industrySector: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        isIn: [
          [
            'machinery',
            'raw_materials',
            'components',
            'electronics',
            'textiles',
            'chemicals',
            'automotive',
            'food_beverage',
            'construction',
            'pharmaceutical',
            'other',
          ],
        ],
      },
      comment: 'Industry sector (machinery, raw_materials, components, etc.)',
    },
    companyType: {
      type: DataTypes.ENUM('buyer', 'supplier', 'both'),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
      comment: 'Type of company in the B2B marketplace',
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          user.password = await User.hashPassword(user.password);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password')) {
          user.password = await User.hashPassword(user.password);
        }
      },
    },
  }
);

export default User;
