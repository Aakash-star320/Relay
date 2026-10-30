import { Router } from "express";
import { z } from "zod";
import { requireWorkspaceAuth } from "../../shared/middleware/auth.js";
import { cancelCollectionRun, getCollectionRun, startCollectionRun } from "./run.service.js";

export const runRouter = Router();
runRouter.use(requireWorkspaceAuth);
runRouter.post("/", async (request, response, next) => { try { const input = z.object({ collectionId: z.string(), stopOnFailure: z.boolean().default(true), environmentId: z.string().nullable().optional() }).parse(request.body); response.status(202).json({ data: await startCollectionRun(String(request.account._id), input.collectionId, input.stopOnFailure, input.environmentId) }); } catch (error) { next(error); } });
runRouter.get("/:runId", async (request, response, next) => { try { response.json({ data: await getCollectionRun(String(request.account._id), request.params.runId) }); } catch (error) { next(error); } });
runRouter.delete("/:runId", async (request, response, next) => { try { response.json({ data: await cancelCollectionRun(String(request.account._id), request.params.runId) }); } catch (error) { next(error); } });
