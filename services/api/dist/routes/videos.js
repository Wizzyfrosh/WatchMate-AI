export const videoRoutes = (content) => {
    return async (fastify) => {
        fastify.get("/v1/videos", async (_request, reply) => {
            const response = {
                videos: content.catalog,
            };
            return reply.status(200).send(response);
        });
        fastify.get("/v1/videos/:id", async (request, reply) => {
            const { id } = request.params;
            const video = content.videoMap.get(id);
            if (!video) {
                const errorResponse = {
                    code: "VIDEO_NOT_FOUND",
                    message: `Video with ID "${id}" was not found in catalog`,
                    correlationId: request.correlationId,
                    retryable: false,
                };
                return reply.status(404).send(errorResponse);
            }
            const response = {
                ...video,
                mediaUrl: `/${video.mediaKey}`,
                captionsUrl: `/${video.captionsKey}`,
            };
            return reply.status(200).send(response);
        });
    };
};
//# sourceMappingURL=videos.js.map