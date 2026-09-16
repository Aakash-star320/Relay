import { z } from "zod";
import * as demoOrdersService from "./demo-orders.service.js";

const createOrderSchema = z.object({ reference: z.string().min(1).max(80), customerName: z.string().min(1).max(120), status: z.enum(["pending", "processing", "shipped", "cancelled"]).optional(), total: z.number().min(0) }).strict();
const updateOrderSchema = createOrderSchema.partial().refine((changes) => Object.keys(changes).length > 0, "Provide at least one field to update.");

export async function listOrders(request, response, next) { try { response.json({ data: await demoOrdersService.listOrders() }); } catch (error) { next(error); } }
export async function getOrder(request, response, next) { try { response.json({ data: await demoOrdersService.getOrder(request.params.orderId) }); } catch (error) { next(error); } }
export async function createOrder(request, response, next) { try { response.status(201).json({ data: await demoOrdersService.createOrder(createOrderSchema.parse(request.body)) }); } catch (error) { next(error); } }
export async function updateOrder(request, response, next) { try { response.json({ data: await demoOrdersService.changeOrder(request.params.orderId, updateOrderSchema.parse(request.body)) }); } catch (error) { next(error); } }
export async function deleteOrder(request, response, next) { try { await demoOrdersService.removeOrder(request.params.orderId); response.status(204).end(); } catch (error) { next(error); } }

export function sendText(request, response) { response.type("text/plain").send("Relay demo endpoint ready."); }
export function sendEmpty(request, response) { response.status(204).end(); }
export function sendStatus(request, response) {
	const status = Number(request.params.status);
	if (!Number.isInteger(status) || status < 100 || status > 599) return response.status(400).json({ error: "Use an HTTP status from 100 to 599." });
	return response.status(status).json({ data: { status, message: `Demo returned HTTP ${status}.` } });
}
export async function delayResponse(request, response) {
	const milliseconds = Number(request.params.milliseconds);
	if (!Number.isInteger(milliseconds) || milliseconds < 0 || milliseconds > 20_000) return response.status(400).json({ error: "Use a delay between 0 and 20000 milliseconds." });
	await new Promise((resolve) => setTimeout(resolve, milliseconds));
	return response.json({ data: { delayedByMs: milliseconds } });
}
