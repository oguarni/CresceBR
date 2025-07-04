import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const env = process.env.NODE_ENV || 'development';

const config = {
  development: {
    username: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    host: process.env.DB_HOST!,
    dialect: 'postgres' as const,
  },
  test: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'crescebr_test',
    host: process.env.DB_HOST || 'postgres',
    dialect: 'postgres' as const,
    logging: false,
  },
  production: {
    username: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    host: process.env.DB_HOST!,
    dialect: 'postgres' as const,
    logging: false,
  },
};

const sequelize = new Sequelize(config[env]);

export default sequelize;
