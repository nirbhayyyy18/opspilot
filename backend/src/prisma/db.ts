import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

const isTestMode = process.env['NODE_ENV'] === 'test';

const databaseUrl = isTestMode
  ? process.env['TEST_DATABASE_URL']
  : process.env['DATABASE_URL'];

if (!databaseUrl) {
  throw new Error(
    isTestMode
      ? 'TEST_DATABASE_URL is required in test mode'
      : 'DATABASE_URL is required',
  );
}

if (
  isTestMode &&
  databaseUrl === process.env['DATABASE_URL']
) {
  throw new Error(
    'Test mode cannot use the development database URL',
  );
}

export const db = postgres<Contract>({
  contractJson,
  url: databaseUrl,
});