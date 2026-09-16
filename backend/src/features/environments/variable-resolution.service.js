import { AppError } from "../../shared/errors/app-error.js";

const VARIABLE_PATTERN = /{{\s*([^{}\s]+)\s*}}/g;
export function resolveVariables(value, variables) {
	return String(value || "").replace(VARIABLE_PATTERN, (placeholder, key) => {
		if (!variables.has(key)) throw new AppError(400, "MISSING_VARIABLE", `Define ${key} in the selected environment before sending this request.`);
		return variables.get(key);
	});
}
