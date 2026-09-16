import { Router } from "express";
import { z } from "zod";
import { requireWorkspaceAuth } from "../../shared/middleware/auth.js";
import { AppError } from "../../shared/errors/app-error.js";
import { ApiCollection } from "./collection.model.js";
import { SavedRequest } from "./saved-request.model.js";

const router = Router();
const row = z.object({ id: z.string(), key: z.string(), value: z.string(), enabled: z.boolean() });
const draft = z.object({ method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]), url: z.string().min(1).max(8000), params: z.array(row).max(100), headers: z.array(row).max(100), body: z.object({ type: z.enum(["none", "json", "text"]), content: z.string().max(100000) }) });
const requestInput = draft.extend({ name: z.string().min(1).max(120), collectionId: z.string().nullable().optional() });
const collectionInput = z.object({ name: z.string().min(1).max(120), description: z.string().max(500).optional() });
const accountId = (request) => String(request.account._id);
const nextOrder = async (Model, filter) => ((await Model.findOne(filter).sort({ sortOrder: -1 }).select("sortOrder").lean())?.sortOrder || 0) + 100;

router.use(requireWorkspaceAuth);
router.get("/", async (request, response, next) => { try { const owner = accountId(request); const [collections, requests] = await Promise.all([ApiCollection.find({ accountId: owner }).sort({ sortOrder: 1 }).lean(), SavedRequest.find({ accountId: owner }).sort({ sortOrder: 1 }).lean()]); response.json({ data: { collections, requests } }); } catch (error) { next(error); } });
router.post("/", async (request, response, next) => { try { const input = collectionInput.parse(request.body); const owner = accountId(request); response.status(201).json({ data: await ApiCollection.create({ ...input, accountId: owner, sortOrder: await nextOrder(ApiCollection, { accountId: owner }) }) }); } catch (error) { next(error); } });
router.patch("/:collectionId", async (request, response, next) => { try { const input = collectionInput.partial().parse(request.body); const item = await ApiCollection.findOneAndUpdate({ _id: request.params.collectionId, accountId: accountId(request) }, input, { new: true }); if (!item) throw new AppError(404, "COLLECTION_NOT_FOUND", "Collection not found."); response.json({ data: item }); } catch (error) { next(error); } });
router.delete("/:collectionId", async (request, response, next) => { try { const owner = accountId(request); const item = await ApiCollection.findOneAndDelete({ _id: request.params.collectionId, accountId: owner }); if (!item) throw new AppError(404, "COLLECTION_NOT_FOUND", "Collection not found."); await SavedRequest.deleteMany({ accountId: owner, collectionId: item._id }); response.status(204).end(); } catch (error) { next(error); } });
router.post("/requests", async (request, response, next) => { try { const input = requestInput.parse(request.body); const owner = accountId(request); if (input.collectionId && !await ApiCollection.exists({ _id: input.collectionId, accountId: owner })) throw new AppError(404, "COLLECTION_NOT_FOUND", "Collection not found."); response.status(201).json({ data: await SavedRequest.create({ ...input, accountId: owner, sortOrder: await nextOrder(SavedRequest, { accountId: owner, collectionId: input.collectionId || null }) }) }); } catch (error) { next(error); } });
router.patch("/requests/:requestId", async (request, response, next) => { try { const input = requestInput.partial().parse(request.body); const item = await SavedRequest.findOneAndUpdate({ _id: request.params.requestId, accountId: accountId(request) }, input, { new: true }); if (!item) throw new AppError(404, "REQUEST_NOT_FOUND", "Saved request not found."); response.json({ data: item }); } catch (error) { next(error); } });
router.delete("/requests/:requestId", async (request, response, next) => { try { const item = await SavedRequest.findOneAndDelete({ _id: request.params.requestId, accountId: accountId(request) }); if (!item) throw new AppError(404, "REQUEST_NOT_FOUND", "Saved request not found."); response.status(204).end(); } catch (error) { next(error); } });
router.post("/requests/:requestId/duplicate", async (request, response, next) => { try { const owner = accountId(request); const original = await SavedRequest.findOne({ _id: request.params.requestId, accountId: owner }).lean(); if (!original) throw new AppError(404, "REQUEST_NOT_FOUND", "Saved request not found."); const { _id, createdAt, updatedAt, ...copy } = original; response.status(201).json({ data: await SavedRequest.create({ ...copy, accountId: owner, name: `${original.name} copy`, sortOrder: await nextOrder(SavedRequest, { accountId: owner, collectionId: original.collectionId }) }) }); } catch (error) { next(error); } });
export const collectionsRouter = router;
