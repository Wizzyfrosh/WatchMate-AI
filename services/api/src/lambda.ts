import awsLambdaFastify from "@fastify/aws-lambda";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildApp } from "./app.js";
import { loadContent } from "./content-loader.js";
import { DynamoSessionStore } from "./dynamo-session-store.js";
import { DynamoQuotaManager } from "./dynamo-quota-manager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contentDir = path.resolve(__dirname, "../../content");

const content = loadContent(contentDir);

// Production stores backed by DynamoDB (PRD §12/§13)
const sessionStore = new DynamoSessionStore();
const quotaManager = new DynamoQuotaManager();

const app = buildApp({
  content,
  isDev: false,
  sessionStore,
  quotaManager,
});

export const handler = awsLambdaFastify(app);
