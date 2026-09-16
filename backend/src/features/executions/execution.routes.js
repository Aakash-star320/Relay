import { Router } from "express";
import { requireWorkspaceAuth } from "../../shared/middleware/auth.js";
import { execute } from "./execution.controller.js";

export const executionRouter = Router();
executionRouter.post("/", requireWorkspaceAuth, execute);
