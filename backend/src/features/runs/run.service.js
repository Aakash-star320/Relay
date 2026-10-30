import crypto from "crypto";
import { ApiCollection } from "../collections/collection.model.js";
import { SavedRequest } from "../collections/saved-request.model.js";
import { executeRequest, cancelExecution } from "../executions/execution.service.js";
import { prepareExecutionDraft } from "../executions/execution-preparation.service.js";
import { evaluateAssertions } from "../assertions/assertion.service.js";
import { AppError } from "../../shared/errors/app-error.js";
import { CollectionRun } from "./run.model.js";

const activeRunExecutions = new Map();

function readJsonPath(body, path) {
	let value;
	try { value = JSON.parse(body); } catch { return undefined; }
	for (const segment of path.replace(/\[(\d+)\]/g, ".$1").split(".")) {
		if (!segment || value === null || value === undefined || !Object.hasOwn(value, segment)) return undefined;
		value = value[segment];
	}
	return value;
}

function serializeExecution(execution) {
	return { kind: execution.kind, durationMs: execution.durationMs, request: { method: execution.request.method }, response: execution.response, error: execution.error };
}

function serializeExtractions(extractions) {
	return extractions.map(({ value, ...extraction }) => extraction);
}

function extractRunVariables(extractions, execution, variables) {
	return extractions.map((extraction) => {
		const value = execution.kind === "response" ? readJsonPath(execution.response.body, extraction.path) : undefined;
		if (value === undefined) return { ...extraction, extracted: false, error: `No JSON value exists at ${extraction.path}.` };
		if (typeof value === "object") return { ...extraction, extracted: false, error: "Extraction values must be a JSON scalar." };
		variables.set(extraction.variable, value);
		return { ...extraction, extracted: true, value: String(value) };
	});
}

async function isCancellationRequested(runId) {
	return Boolean((await CollectionRun.findById(runId).select("cancelRequested").lean())?.cancelRequested);
}

async function performRun(runId, accountId, requests) {
	const run = await CollectionRun.findById(runId).lean();
	if (!run) return;
	const variables = new Map();
	for (const savedRequest of requests) {
		if (await isCancellationRequested(runId)) break;
		const executionId = crypto.randomUUID();
		activeRunExecutions.set(String(runId), executionId);
		let execution;
		let assertions = [];
		let extractions = [];
		try {
			const draft = { ...savedRequest, executionId, collectionId: String(run.collectionId), environmentId: run.environmentId || null };
			execution = await executeRequest(accountId, await prepareExecutionDraft(accountId, draft, variables));
			assertions = evaluateAssertions(savedRequest.assertions || [], execution);
			extractions = extractRunVariables(savedRequest.extractions || [], execution, variables);
		} catch (error) {
			execution = { kind: "error", request: { method: savedRequest.method }, error: { code: error.code || "RELAY_ERROR", message: error.message }, durationMs: null };
		}
		activeRunExecutions.delete(String(runId));
		const failed = execution.kind === "error" || assertions.some((assertion) => !assertion.passed) || extractions.some((extraction) => !extraction.extracted);
		await CollectionRun.updateOne({ _id: runId }, { $push: { results: { requestId: String(savedRequest._id), name: savedRequest.name, execution: serializeExecution(execution), assertions, extractions: serializeExtractions(extractions), failed } }, $inc: { completed: 1 } });
		if (failed && run.stopOnFailure) break;
	}
	activeRunExecutions.delete(String(runId));
	const cancelled = await isCancellationRequested(runId);
	await CollectionRun.updateOne({ _id: runId }, { status: cancelled ? "cancelled" : "completed" });
}

export async function startCollectionRun(accountId, collectionId, stopOnFailure, environmentId) {
	const collection = await ApiCollection.findOne({ _id: collectionId, accountId }).lean();
	if (!collection) throw new AppError(404, "COLLECTION_NOT_FOUND", "Collection not found.");
	const requests = await SavedRequest.find({ accountId, collectionId }).sort({ sortOrder: 1 }).lean();
	const run = await CollectionRun.create({ accountId, collectionId, environmentId: environmentId || null, stopOnFailure, status: "running", total: requests.length, cancelRequested: false });
	void performRun(run._id, accountId, requests);
	return run.toObject();
}

export async function getCollectionRun(accountId, runId) {
	const run = await CollectionRun.findOne({ _id: runId, accountId }).lean();
	if (!run) throw new AppError(404, "RUN_NOT_FOUND", "Collection run not found.");
	return run;
}

export async function cancelCollectionRun(accountId, runId) {
	const run = await CollectionRun.findOne({ _id: runId, accountId, status: "running" });
	if (!run) throw new AppError(404, "RUN_NOT_FOUND", "Active collection run not found.");
	run.cancelRequested = true;
	await run.save();
	const executionId = activeRunExecutions.get(String(runId));
	if (executionId) cancelExecution(accountId, executionId);
	return { cancelled: true };
}
