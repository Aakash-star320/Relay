import { DemoOrder } from "./demo-order.model.js";

export function listDemoOrders() { return DemoOrder.find().sort({ createdAt: 1 }).lean(); }
export function findDemoOrder(orderId) { return DemoOrder.findById(orderId).lean(); }
export function createDemoOrder(order) { return DemoOrder.create(order); }
export function updateDemoOrder(orderId, changes) { return DemoOrder.findByIdAndUpdate(orderId, changes, { new: true, runValidators: true }).lean(); }
export function deleteDemoOrder(orderId) { return DemoOrder.findByIdAndDelete(orderId).lean(); }
