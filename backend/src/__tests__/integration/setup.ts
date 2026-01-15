import { Sequelize } from 'sequelize';

// PostgreSQL test database connection for integration tests
export const testSequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5433'),
  username: process.env.TEST_DB_USER || 'testuser',
  password: process.env.TEST_DB_PASSWORD || 'testpass',
  database: process.env.TEST_DB_NAME || 'crescebr_test',
  logging: false,
});

export const setupTestDatabase = async (): Promise<void> => {
  try {
    await testSequelize.authenticate();
    console.log('Test database connection established (PostgreSQL).');
    await testSequelize.sync({ force: true });
    console.log('Test database synchronized.');
  } catch (error) {
    console.error('Unable to connect to the test database:', error);
    throw error;
  }
};

export const teardownTestDatabase = async (): Promise<void> => {
  try {
    await testSequelize.close();
    console.log('Test database connection closed.');
  } catch (error) {
    console.error('Error closing test database connection:', error);
  }
};

export default testSequelize;
