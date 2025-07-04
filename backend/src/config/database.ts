import { Sequelize } from 'sequelize';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables for test environment
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });
} else {
  dotenv.config(); // Load .env for development
}

import config from '../../config/config.json';

const env = (process.env.NODE_ENV as 'development' | 'test' | 'production') || 'development';
const dbConfig = config[env];

let sequelize: Sequelize;

if (dbConfig.use_env_variable) {
  const dbUrl = process.env[dbConfig.use_env_variable];
  if (!dbUrl) {
    throw new Error(`Environment variable ${dbConfig.use_env_variable} is not set.`);
  }
  sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  });
} else {
  sequelize = new Sequelize({
    ...dbConfig,
    dialect: 'postgres',
    port: parseInt(dbConfig.port, 10),
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  });
}

export default sequelize;
