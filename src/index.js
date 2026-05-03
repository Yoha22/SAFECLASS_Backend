import app from './app.js';
import { env } from './config/env.js';
import prisma from './config/database.js';

async function main() {
  await prisma.$connect();
  console.log('Database connected');

  app.listen(env.port, () => {
    console.log(`SAFECLASS API running on http://localhost:${env.port} [${env.nodeEnv}]`);
  });
}

main().catch((err) => {
  console.error('Fatal error on startup:', err);
  process.exit(1);
});
