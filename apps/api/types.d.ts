import 'fastify';

type JwtUser = { sub: string; email?: string; role?: string };

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: import('fastify').preHandlerHookHandler;
    authorize: import('fastify').preHandlerHookHandler;
  }

  interface FastifyRequest {
    user?: JwtUser;
    rawBody?: string;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtUser;
    user: JwtUser;
  }
}
