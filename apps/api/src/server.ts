import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import jwt from '@fastify/jwt';
import rawBody from 'fastify-raw-body';
import compress from '@fastify/compress';
import { env } from './env';
import { registerRoutes } from './routes';
import authPlugin from './plugins/auth';

export async function buildServer() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
  });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(helmet);
  await app.register(compress, { global: true, encodings: ['br', 'gzip'] });
  await app.register(rateLimit, { max: 200, timeWindow: '1 minute' });
  await app.register(jwt, { secret: env.JWT_SECRET });
  await app.register(rawBody, { field: 'rawBody', global: false, encoding: 'utf8', runFirst: true });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'ContentGuard Pro API',
        version: '0.1.0',
      },
      servers: [{ url: 'http://localhost:' + env.PORT }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });
  await app.register(swaggerUI, { routePrefix: '/docs' });

  await app.register(authPlugin);
  await registerRoutes(app);

  app.setErrorHandler((error, _req, reply) => {
    app.log.error(error);
    const status = (error as any).statusCode || 500;
    reply.code(status).send({ error: error.message || 'Internal Server Error' });
  });

  return app;
}
