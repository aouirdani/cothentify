import "fastify";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: import("fastify").preHandlerHookHandler;
    authorize: import("fastify").preHandlerHookHandler;
  }
  interface FastifyRequest {
    user?: { sub: string; email?: string; role?: string };
  }
}

