import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildApp } from "./app.js";
import { loadContent } from "./content-loader.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function start() {
    const port = parseInt(process.env.PORT || "3000", 10);
    const host = process.env.HOST || "127.0.0.1";
    const contentDir = process.env.CONTENT_DIR
        ? path.resolve(process.cwd(), process.env.CONTENT_DIR)
        : path.resolve(__dirname, "../../../content");
    console.log(`Loading content from: ${contentDir}`);
    const content = loadContent(contentDir);
    const app = buildApp({
        content,
        isDev: process.env.NODE_ENV !== "production",
    });
    try {
        const address = await app.listen({ port, host });
        console.log(`WatchMate API listening on ${address}`);
    }
    catch (err) {
        console.error("Failed to start WatchMate API server:", err);
        process.exit(1);
    }
}
start();
//# sourceMappingURL=index.js.map