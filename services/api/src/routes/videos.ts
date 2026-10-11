import type { FastifyPluginAsync } from "fastify";
import type { LoadedContent } from "../content-loader.js";
import type { VideoListResponse, VideoDetailResponse, ErrorResponse } from "@watchmate/contracts";

export const videoRoutes = (content: LoadedContent): FastifyPluginAsync => {
  return async (fastify) => {
    fastify.get("/v1/videos", async (_request, reply) => {
      const response: VideoListResponse = {
        videos: content.catalog,
      };
      return reply.status(200).send(response);
    });

    fastify.get<{ Params: { id: string } }>("/v1/videos/:id", async (request, reply) => {
      const { id } = request.params;
      const video = content.videoMap.get(id);

      if (!video) {
        const errorResponse: ErrorResponse = {
          code: "VIDEO_NOT_FOUND",
          message: `Video with ID "${id}" was not found in catalog`,
          correlationId: (request as any).correlationId,
          retryable: false,
        };
        return reply.status(404).send(errorResponse);
      }

      const response: VideoDetailResponse = {
        ...video,
        mediaUrl: `/${video.mediaKey}`,
        captionsUrl: `/${video.captionsKey}`,
      };
      return reply.status(200).send(response);
    });
  };
};
