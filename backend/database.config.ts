import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from 'dotenv';

// Source lives in backend/, compiled code in backend/dist/.
export const backendRoot = existsSync(resolve(__dirname, 'package.json'))
  ? __dirname
  : resolve(__dirname, '..');

export function getDatabaseConfig() {
  // Deployment environment variables take precedence over the local file.
  config({ path: resolve(backendRoot, '.env'), quiet: true });

  const required = (name: string): string => {
    const value = process.env[name];
    if (value === undefined || value.trim() === '') {
      throw new Error(`Missing database setting: ${name}. See backend/.env.example.`);
    }
    return value;
  };

  const host = required('DB_HOST');
  const portText = required('DB_PORT');
  const port = Number(portText);
  if (!/^\d+$/.test(portText) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('DB_PORT must be an integer between 1 and 65535.');
  }

  return {
    host,
    port,
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    database: required('DB_NAME'),
  };
}
