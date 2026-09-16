import { executionRequestSchema } from "./execution.schema.js";
import { executeRequest } from "./execution.service.js";

export async function execute(request, response, next) {
	try {
		const draft = executionRequestSchema.parse(request.body);
		response.json({ data: await executeRequest(String(request.account._id), draft) });
	} catch (error) { next(error); }
}
