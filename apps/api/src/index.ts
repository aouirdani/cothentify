import { env } from './env';
import { buildServer } from './server';

async function main() {
  const app = await buildServer();

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info(`API listening on http://localhost:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();

