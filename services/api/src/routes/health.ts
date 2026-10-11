import type { FastifyPluginAsync } from "fastify";
import type { HealthResponse } from "@watchmate/contracts";

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/health", async (_request, reply) => {
    const response: HealthResponse = {
      status: "ok",
    };
    return reply.status(200).send(response);
  });
};
