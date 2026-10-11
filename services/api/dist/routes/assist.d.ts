import type { FastifyPluginAsync } from "fastify";
import type { LoadedContent } from "../content-loader.js";
import { type AiProvider } from "../bedrock.js";
export declare const assistRoutes: (content: LoadedContent, aiProvider?: AiProvider) => FastifyPluginAsync;
//# sourceMappingURL=assist.d.ts.map