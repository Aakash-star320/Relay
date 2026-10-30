import { z } from "zod";

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
const keyValueRowSchema = z.object({
	id: z.string().min(1).max(100),
	key: z.string().max(500),
	value: z.string().max(20_000),
	enabled: z.boolean(),
}).strict();
const authSchema = z.object({ type: z.enum(["inherit", "none", "bearer", "basic", "apiKey"]), token: z.string().max(5000).optional(), username: z.string().max(5000).optional(), password: z.string().max(5000).optional(), key: z.string().max(500).optional(), value: z.string().max(5000).optional(), addTo: z.enum(["header", "query"]).optional() }).optional();
export const assertionSchema = z.object({ id: z.string().min(1).max(100), type: z.enum(["status", "duration", "json"]), operator: z.enum(["equals", "notEquals", "contains", "exists"]), expected: z.string().max(1000), path: z.string().max(500).optional() }).strict();
export const extractionSchema = z.object({ id: z.string().min(1), path: z.string().min(1).max(500), variable: z.string().min(1).max(120) });

export const executionRequestSchema = z.object({
	executionId: z.string().uuid(),
	method: z.enum(HTTP_METHODS),
	url: z.string().min(1).max(8_000),
	params: z.array(keyValueRowSchema).max(100),
	headers: z.array(keyValueRowSchema).max(100),
	body: z.object({
		type: z.enum(["none", "json", "text"]),
		content: z.string().max(100_000),
	}).strict(),
	environmentId: z.string().nullable().optional(),
	collectionId: z.string().nullable().optional(),
	auth: authSchema,
	assertions: z.array(assertionSchema).max(20).default([]),
	extractions: z.array(extractionSchema).max(20).default([]),
}).strict();
