import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { getConfig } from "../../shared/config/index.js";
import { AppError } from "../../shared/errors/app-error.js";
import { authRepository } from "./auth.repository.js";

const publicAccount = (account) => ({ _id: String(account._id), name: account.name, email: account.email });

function signAccountToken(account) {
	return jwt.sign({ sub: String(account._id), type: "account" }, getConfig().jwtSecret, {
		expiresIn: getConfig().jwtExpiresIn,
		issuer: "relay-api",
		audience: "relay-app",
	});
}

export const authService = {
	async login(email, password) {
		const account = await authRepository.findActiveByEmailWithPassword(email.toLowerCase());
		const validPassword = account ? await bcrypt.compare(password, account.passwordHash) : false;
		if (!validPassword) throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
		return { account: publicAccount(account), token: signAccountToken(account) };
	},

	async authenticate(token) {
		let payload;
		try {
			payload = jwt.verify(token, getConfig().jwtSecret, { issuer: "relay-api", audience: "relay-app" });
		} catch {
			throw new AppError(401, "INVALID_TOKEN", "Your Relay session is invalid or has expired.");
		}

		if (!mongoose.isValidObjectId(payload.sub) || payload.type !== "account") {
			throw new AppError(401, "INVALID_TOKEN", "Your Relay session is invalid or has expired.");
		}

		const account = await authRepository.findActiveById(payload.sub);
		if (!account) throw new AppError(401, "ACCOUNT_UNAVAILABLE", "This Relay account is no longer available.");
		return { account, payload };
	},

	session(account) {
		return { account: publicAccount(account) };
	},
};
