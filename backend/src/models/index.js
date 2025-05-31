const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgresql://postgres:password@postgres:5432/b2b_marketplace',
  {
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialect: 'postgres',
    dialectOptions: process.env.NODE_ENV === 'production' ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {}
  }
);

// User Model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  cpf: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  companyName: {
    type: DataTypes.STRING
  },
  cnpj: {
    type: DataTypes.STRING,
    unique: true,
    sparse: true
  },
  phone: {
    type: DataTypes.STRING
  },
  address: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  role: {
    type: DataTypes.ENUM('buyer', 'supplier', 'admin'),
    defaultValue: 'buyer'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  hooks: {
    beforeCreate: async (user) => {
      user.password = await bcrypt.hash(user.password, 10);
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
});

// Product Model
const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  unit: {
    type: DataTypes.STRING,
    allowNull: false
  },
  minOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  images: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  specifications: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

// Supplier Model
const Supplier = sequelize.define('Supplier', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tradingName: {
    type: DataTypes.STRING
  },
  cnpj: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT
  },
  logo: {
    type: DataTypes.STRING
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0
  },
  totalOrders: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  subscriptionPlan: {
    type: DataTypes.ENUM('free', 'basic', 'pro'),
    defaultValue: 'free'
  },
  subscriptionExpiresAt: {
    type: DataTypes.DATE
  }
});

// Order Model
const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  orderNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  supplierId: {
    type: DataTypes.UUID
  },
  status: {
    type: DataTypes.ENUM('quote_requested', 'quote_sent', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'),
    defaultValue: 'quote_requested'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2)
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2)
  },
  tax: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  shipping: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  shippingAddress: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  billingAddress: {
    type: DataTypes.JSONB
  },
  paymentMethod: {
    type: DataTypes.STRING,
    defaultValue: 'invoice'
  },
  paymentTerms: {
    type: DataTypes.STRING,
    defaultValue: '30 days'
  },
  notes: {
    type: DataTypes.TEXT
  },
  quoteValidUntil: {
    type: DataTypes.DATE
  }
});

// OrderItem Model
const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
});

// Quote Model for B2B
const Quote = sequelize.define('Quote', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  quoteNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  supplierId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'accepted', 'rejected', 'expired'),
    defaultValue: 'pending'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  validUntil: {
    type: DataTypes.DATE,
    allowNull: false
  },
  terms: {
    type: DataTypes.TEXT
  },
  items: {
    type: DataTypes.JSONB,
    allowNull: false
  }
});

// Review Model
const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  supplierId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  comment: {
    type: DataTypes.TEXT
  }
});

// Category Model
const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT
  },
  icon: {
    type: DataTypes.STRING
  },
  parentId: {
    type: DataTypes.UUID
  }
});

// Associations
User.hasOne(Supplier, { foreignKey: 'userId' });
Supplier.belongsTo(User, { foreignKey: 'userId' });

Supplier.hasMany(Product, { foreignKey: 'supplierId' });
Product.belongsTo(Supplier, { foreignKey: 'supplierId' });

User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });

Supplier.hasMany(Order, { foreignKey: 'supplierId' });
Order.belongsTo(Supplier, { foreignKey: 'supplierId' });

Order.hasMany(OrderItem, { foreignKey: 'orderId' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

Product.hasMany(OrderItem, { foreignKey: 'productId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });

Order.hasMany(Quote, { foreignKey: 'orderId' });
Quote.belongsTo(Order, { foreignKey: 'orderId' });

Supplier.hasMany(Quote, { foreignKey: 'supplierId' });
Quote.belongsTo(Supplier, { foreignKey: 'supplierId' });

Category.hasMany(Product, { foreignKey: 'categoryId' });
Product.belongsTo(Category, { foreignKey: 'categoryId' });

// Category self-referencing associations for parent/child hierarchy
Category.hasMany(Category, { as: 'children', foreignKey: 'parentId' });
Category.belongsTo(Category, { as: 'parent', foreignKey: 'parentId' });

// Methods
User.prototype.validatePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = {
  sequelize,
  User,
  Product,
  Supplier,
  Order,
  OrderItem,
  Quote,
  Review,
  Category
};