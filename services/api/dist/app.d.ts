import { type FastifyInstance } from "fastify";
import type { LoadedContent } from "./content-loader.js";
import { type AiProvider } from "./bedrock.js";
import { type SessionStore } from "./auth.js";
import { type QuotaManager } from "./quota.js";
export interface AppOptions {
    content: LoadedContent;
    isDev?: boolean;
    aiProvider?: AiProvider;
    sessionStore?: SessionStore;
    quotaManager?: QuotaManager;
}
export declare function buildApp(options: AppOptions): FastifyInstance;
//# sourceMappingURL=app.d.ts.map