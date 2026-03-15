import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { createTypeOrmCliOptions } from './typeorm.config';

export default new DataSource(createTypeOrmCliOptions());
