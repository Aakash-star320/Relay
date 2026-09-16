import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import { authRouter } from "./features/auth/auth.routes.js";
import { demoRouter } from "./features/demo/demo.routes.js";
import { executionRouter } from "./features/executions/execution.routes.js";
import { collectionsRouter } from "./features/collections/collections.routes.js";
import { environmentsRouter } from "./features/environments/environments.routes.js";
import { historyRouter } from "./features/history/history.routes.js";
import { errorHandler, notFoundHandler } from "./shared/middleware/error-handler.js";

const publicDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public");

export function createApp() {
    const app = express();
    app.disable("x-powered-by");
    app.use(cors());
    app.use(express.json({ limit: "100kb" }));
    app.use(express.static(publicDirectory));
    app.get("/api/v1/health", (request, response) => {
        const database = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
        response.status(database === "connected" ? 200 : 503).json({ data: { status: database === "connected" ? "ok" : "degraded", database } });
    });
    app.use("/api/v1/auth", authRouter);
    app.use("/api/v1/executions", executionRouter);
    app.use("/api/v1/collections", collectionsRouter);
    app.use("/api/v1/environments", environmentsRouter);
    app.use("/api/v1/history", historyRouter);
    app.use("/demo", demoRouter);
    app.use(notFoundHandler);
    app.use(errorHandler);
    return app;
}
