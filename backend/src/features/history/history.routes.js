import { Router } from "express";
import { z } from "zod";
import { requireWorkspaceAuth } from "../../shared/middleware/auth.js";
import { getExecutionHistory, listExecutionHistory } from "./history.service.js";

const router = Router();
const querySchema = z.object({ cursor: z.string().optional(), limit: z.coerce.number().int().min(1).max(50).default(25), method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]).optional(), outcome: z.enum(["response", "error"]).optional() });

router.use(requireWorkspaceAuth);
router.get("/", async (request, response, next) => { try { response.json({ data: await listExecutionHistory(String(request.account._id), querySchema.parse(request.query)) }); } catch (error) { next(error); } });
router.get("/:historyId", async (request, response, next) => { try { response.json({ data: await getExecutionHistory(String(request.account._id), request.params.historyId) }); } catch (error) { next(error); } });

export const historyRouter = router;
