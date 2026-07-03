import { DataSource } from 'typeorm';
import { config } from 'dotenv';
config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: +(process.env.DB_PORT ?? '5432'),
  username: process.env.DB_USERNAME ?? 'velo',
  password: process.env.DB_PASSWORD ?? 'velo_dev',
  database: process.env.DB_DATABASE ?? 'velo',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
});
