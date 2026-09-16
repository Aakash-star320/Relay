import { Router } from "express";
import { createOrder, deleteOrder, delayResponse, getOrder, listOrders, sendEmpty, sendStatus, sendText, updateOrder } from "./demo.controller.js";

export const demoRouter = Router();
demoRouter.get("/orders", listOrders);
demoRouter.post("/orders", createOrder);
demoRouter.get("/orders/:orderId", getOrder);
demoRouter.patch("/orders/:orderId", updateOrder);
demoRouter.delete("/orders/:orderId", deleteOrder);
demoRouter.get("/text", sendText);
demoRouter.get("/empty", sendEmpty);
demoRouter.get("/status/:status", sendStatus);
demoRouter.get("/delay/:milliseconds", delayResponse);
