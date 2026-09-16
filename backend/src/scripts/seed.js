import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { WorkspaceAccount } from "../features/auth/workspace-account.model.js";
import { DemoOrder } from "../features/demo/demo-order.model.js";
import { connectDatabase, disconnectDatabase } from "../shared/config/database.js";
import { loadConfig } from "../shared/config/index.js";

const DEMO_PASSWORD = "password123";
const PASSWORD_ROUNDS = 12;

const demoAccounts = [
	{ _id: new mongoose.Types.ObjectId("680000000000000000000001"), name: "Alex Morgan", email: "alex.morgan@relay.dev", active: true },
	{ _id: new mongoose.Types.ObjectId("680000000000000000000002"), name: "Jordan Smith", email: "jordan.smith@relay.dev", active: true },
];

const demoOrders = [
	{ _id: new mongoose.Types.ObjectId("690000000000000000000001"), reference: "ORD-1001", customerName: "Ava Patel", status: "processing", total: 84.5 },
	{ _id: new mongoose.Types.ObjectId("690000000000000000000002"), reference: "ORD-1002", customerName: "Noah Kim", status: "pending", total: 129.99 },
];

async function seedAccounts() {
	const passwordHash = await bcrypt.hash(DEMO_PASSWORD, PASSWORD_ROUNDS);
	await WorkspaceAccount.deleteMany({});
	await WorkspaceAccount.insertMany(demoAccounts.map((account) => ({ ...account, passwordHash })));
	return WorkspaceAccount.countDocuments();
}

async function seedDemoOrders() {
	await DemoOrder.deleteMany({});
	await DemoOrder.insertMany(demoOrders);
	return DemoOrder.countDocuments();
}

async function seedDatabase() {
	const config = loadConfig();
	await connectDatabase(config.mongodbUri);
	try {
		const accountCount = await seedAccounts();
		const orderCount = await seedDemoOrders();
		console.log(`Seeded Relay database with ${accountCount} demo accounts and ${orderCount} demo orders.`);
		console.log(`Demo login: ${demoAccounts[0].email} / ${DEMO_PASSWORD}`);
	} finally {
		await disconnectDatabase();
	}
}

await seedDatabase();
