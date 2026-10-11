export const healthRoutes = async (fastify) => {
    fastify.get("/health", async (_request, reply) => {
        const response = {
            status: "ok",
        };
        return reply.status(200).send(response);
    });
};
//# sourceMappingURL=health.js.map