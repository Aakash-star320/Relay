import { Router } from "express";
import { z } from "zod";
import { requireWorkspaceAuth } from "../../shared/middleware/auth.js";
import { AppError } from "../../shared/errors/app-error.js";
import { Environment } from "./environment.model.js";

const router = Router();
const input = z.object({ name: z.string().min(1).max(120), variables: z.array(z.object({ key: z.string().min(1).max(120), value: z.string().max(5000) })).max(100) });
const ownerId = (request) => String(request.account._id);
router.use(requireWorkspaceAuth);
router.get("/", async (request, response, next) => { try { response.json({ data: await Environment.find({ accountId: ownerId(request) }).sort({ name: 1 }).lean() }); } catch (error) { next(error); } });
router.post("/", async (request, response, next) => { try { response.status(201).json({ data: await Environment.create({ ...input.parse(request.body), accountId: ownerId(request) }) }); } catch (error) { next(error); } });
router.patch("/:environmentId", async (request, response, next) => { try { const environment = await Environment.findOneAndUpdate({ _id: request.params.environmentId, accountId: ownerId(request) }, input.partial().parse(request.body), { new: true }); if (!environment) throw new AppError(404, "ENVIRONMENT_NOT_FOUND", "Environment not found."); response.json({ data: environment }); } catch (error) { next(error); } });
router.delete("/:environmentId", async (request, response, next) => { try { const environment = await Environment.findOneAndDelete({ _id: request.params.environmentId, accountId: ownerId(request) }); if (!environment) throw new AppError(404, "ENVIRONMENT_NOT_FOUND", "Environment not found."); response.status(204).end(); } catch (error) { next(error); } });
export const environmentsRouter = router;
