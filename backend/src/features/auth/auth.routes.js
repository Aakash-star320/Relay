import { Router } from "express";
import { login, logout, session } from "./auth.controller.js";
import { requireWorkspaceAuth } from "../../shared/middleware/auth.js";

export const authRouter = Router();
authRouter.post("/login", login);
authRouter.get("/session", requireWorkspaceAuth, session);
authRouter.post("/logout", requireWorkspaceAuth, logout);
