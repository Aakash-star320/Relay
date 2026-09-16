import mongoose from "mongoose";
import { AppError } from "../../shared/errors/app-error.js";
import * as demoOrdersRepository from "./demo-orders.repository.js";

function assertValidOrderId(orderId) {
	if (!mongoose.isValidObjectId(orderId)) throw new AppError(404, "ORDER_NOT_FOUND", "The requested demo order was not found.");
}

export async function listOrders() { return demoOrdersRepository.listDemoOrders(); }
export async function getOrder(orderId) {
	assertValidOrderId(orderId);
	const order = await demoOrdersRepository.findDemoOrder(orderId);
	if (!order) throw new AppError(404, "ORDER_NOT_FOUND", "The requested demo order was not found.");
	return order;
}
export async function createOrder(order) { return demoOrdersRepository.createDemoOrder(order); }
export async function changeOrder(orderId, changes) {
	assertValidOrderId(orderId);
	const order = await demoOrdersRepository.updateDemoOrder(orderId, changes);
	if (!order) throw new AppError(404, "ORDER_NOT_FOUND", "The requested demo order was not found.");
	return order;
}
export async function removeOrder(orderId) {
	assertValidOrderId(orderId);
	const order = await demoOrdersRepository.deleteDemoOrder(orderId);
	if (!order) throw new AppError(404, "ORDER_NOT_FOUND", "The requested demo order was not found.");
}
