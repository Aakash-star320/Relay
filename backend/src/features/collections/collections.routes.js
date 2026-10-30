import { Router } from "express";
import { z } from "zod";
import { requireWorkspaceAuth } from "../../shared/middleware/auth.js";
import { AppError } from "../../shared/errors/app-error.js";
import { ApiCollection } from "./collection.model.js";
import { SavedRequest } from "./saved-request.model.js";
import { assertionSchema, extractionSchema } from "../executions/execution.schema.js";

const router = Router();
const row = z.object({ id: z.string(), key: z.string(), value: z.string(), enabled: z.boolean() });
const auth = z.object({ type: z.enum(["inherit", "none", "bearer", "basic", "apiKey"]), token: z.string().max(5000).optional(), username: z.string().max(5000).optional(), password: z.string().max(5000).optional(), key: z.string().max(500).optional(), value: z.string().max(5000).optional(), addTo: z.enum(["header", "query"]).optional() });
const draft = z.object({ method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]), url: z.string().min(1).max(8000), params: z.array(row).max(100), headers: z.array(row).max(100), body: z.object({ type: z.enum(["none", "json", "text"]), content: z.string().max(100000) }), auth: auth.optional(), assertions: z.array(assertionSchema).max(20).default([]), extractions: z.array(extractionSchema).max(20).default([]) });
const requestInput = draft.extend({ name: z.string().min(1).max(120), collectionId: z.string().nullable().optional() });
const collectionInput = z.object({ name: z.string().min(1).max(120), description: z.string().max(500).optional(), auth: auth.optional() });
const accountId = (request) => String(request.account._id);
const nextOrder = async (Model, filter) => ((await Model.findOne(filter).sort({ sortOrder: -1 }).select("sortOrder").lean())?.sortOrder || 0) + 100;
const MINIMUM_ORDER_GAP = 0.001;

async function resolveSortOrder(Model, filter, itemId, previousId, nextId) {
	const items = await Model.find(filter).sort({ sortOrder: 1 }).select("_id sortOrder").lean();
	const remainingItems = items.filter((item) => String(item._id) !== String(itemId));
	const previousIndex = previousId ? remainingItems.findIndex((item) => String(item._id) === previousId) : -1;
	const nextIndex = nextId ? remainingItems.findIndex((item) => String(item._id) === nextId) : -1;
	if ((previousId && previousIndex < 0) || (nextId && nextIndex < 0) || (previousIndex >= nextIndex && nextIndex >= 0)) throw new AppError(400, "INVALID_ORDER", "The requested position is invalid.");
	const previousOrder = previousIndex >= 0 ? remainingItems[previousIndex].sortOrder : null;
	const nextOrderValue = nextIndex >= 0 ? remainingItems[nextIndex].sortOrder : null;
	if (previousOrder === null) return nextOrderValue === null ? 100 : nextOrderValue - 100;
	if (nextOrderValue === null) return previousOrder + 100;
	if (nextOrderValue - previousOrder >= MINIMUM_ORDER_GAP) return (previousOrder + nextOrderValue) / 2;
	await Promise.all(remainingItems.map((item, index) => Model.updateOne({ _id: item._id }, { sortOrder: (index + 1) * 100 })));
	return (previousIndex + 1) * 100 + 50;
}

router.use(requireWorkspaceAuth);
router.get("/", async (request, response, next) => { try { const owner = accountId(request); const [collections, requests] = await Promise.all([ApiCollection.find({ accountId: owner }).sort({ sortOrder: 1 }).lean(), SavedRequest.find({ accountId: owner }).sort({ sortOrder: 1 }).lean()]); response.json({ data: { collections, requests } }); } catch (error) { next(error); } });
router.post("/", async (request, response, next) => { try { const input = collectionInput.parse(request.body); const owner = accountId(request); response.status(201).json({ data: await ApiCollection.create({ ...input, accountId: owner, sortOrder: await nextOrder(ApiCollection, { accountId: owner }) }) }); } catch (error) { next(error); } });
router.patch("/:collectionId", async (request, response, next) => { try { const input = collectionInput.partial().parse(request.body); const item = await ApiCollection.findOneAndUpdate({ _id: request.params.collectionId, accountId: accountId(request) }, input, { new: true }); if (!item) throw new AppError(404, "COLLECTION_NOT_FOUND", "Collection not found."); response.json({ data: item }); } catch (error) { next(error); } });
router.patch("/:collectionId/order", async (request, response, next) => { try { const owner = accountId(request); const input = z.object({ previousId: z.string().nullable().optional(), nextId: z.string().nullable().optional() }).parse(request.body); const item = await ApiCollection.findOne({ _id: request.params.collectionId, accountId: owner }); if (!item) throw new AppError(404, "COLLECTION_NOT_FOUND", "Collection not found."); item.sortOrder = await resolveSortOrder(ApiCollection, { accountId: owner }, item._id, input.previousId, input.nextId); await item.save(); response.json({ data: item }); } catch (error) { next(error); } });
router.delete("/:collectionId", async (request, response, next) => { try { const owner = accountId(request); const item = await ApiCollection.findOneAndDelete({ _id: request.params.collectionId, accountId: owner }); if (!item) throw new AppError(404, "COLLECTION_NOT_FOUND", "Collection not found."); await SavedRequest.deleteMany({ accountId: owner, collectionId: item._id }); response.status(204).end(); } catch (error) { next(error); } });
router.post("/requests", async (request, response, next) => { try { const input = requestInput.parse(request.body); const owner = accountId(request); if (input.collectionId && !await ApiCollection.exists({ _id: input.collectionId, accountId: owner })) throw new AppError(404, "COLLECTION_NOT_FOUND", "Collection not found."); response.status(201).json({ data: await SavedRequest.create({ ...input, accountId: owner, sortOrder: await nextOrder(SavedRequest, { accountId: owner, collectionId: input.collectionId || null }) }) }); } catch (error) { next(error); } });
router.patch("/requests/:requestId", async (request, response, next) => { try { const input = requestInput.partial().parse(request.body); const owner = accountId(request); if (input.collectionId && !await ApiCollection.exists({ _id: input.collectionId, accountId: owner })) throw new AppError(404, "COLLECTION_NOT_FOUND", "Collection not found."); const item = await SavedRequest.findOneAndUpdate({ _id: request.params.requestId, accountId: owner }, input, { new: true }); if (!item) throw new AppError(404, "REQUEST_NOT_FOUND", "Saved request not found."); response.json({ data: item }); } catch (error) { next(error); } });
router.patch("/requests/:requestId/order", async (request, response, next) => { try { const owner = accountId(request); const input = z.object({ previousId: z.string().nullable().optional(), nextId: z.string().nullable().optional() }).parse(request.body); const item = await SavedRequest.findOne({ _id: request.params.requestId, accountId: owner }); if (!item) throw new AppError(404, "REQUEST_NOT_FOUND", "Saved request not found."); item.sortOrder = await resolveSortOrder(SavedRequest, { accountId: owner, collectionId: item.collectionId || null }, item._id, input.previousId, input.nextId); await item.save(); response.json({ data: item }); } catch (error) { next(error); } });
router.delete("/requests/:requestId", async (request, response, next) => { try { const item = await SavedRequest.findOneAndDelete({ _id: request.params.requestId, accountId: accountId(request) }); if (!item) throw new AppError(404, "REQUEST_NOT_FOUND", "Saved request not found."); response.status(204).end(); } catch (error) { next(error); } });
router.post("/requests/:requestId/duplicate", async (request, response, next) => { try { const owner = accountId(request); const original = await SavedRequest.findOne({ _id: request.params.requestId, accountId: owner }).lean(); if (!original) throw new AppError(404, "REQUEST_NOT_FOUND", "Saved request not found."); const { _id, createdAt, updatedAt, ...copy } = original; response.status(201).json({ data: await SavedRequest.create({ ...copy, accountId: owner, name: `${original.name} copy`, sortOrder: await nextOrder(SavedRequest, { accountId: owner, collectionId: original.collectionId }) }) }); } catch (error) { next(error); } });
export const collectionsRouter = router;
