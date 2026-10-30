function readJsonPath(body, path) {
	if (!path) return undefined;
	let value;
	try { value = JSON.parse(body); } catch { return undefined; }
	for (const segment of path.replace(/\[(\d+)\]/g, ".$1").split(".")) {
		if (!segment || value === null || value === undefined || !Object.hasOwn(value, segment)) return undefined;
		value = value[segment];
	}
	return value;
}

function compare(actual, operator, expected) {
	if (operator === "exists") return actual !== undefined;
	if (operator === "contains") return String(actual ?? "").includes(expected);
	if (operator === "equals") return String(actual) === expected;
	return String(actual) !== expected;
}

export function evaluateAssertions(assertions = [], result) {
	return assertions.map((assertion) => {
		if (assertion.type === "status") {
			const actual = result.kind === "response" ? result.response.status : null;
			return { ...assertion, actual: actual === null ? "No response" : String(actual), passed: actual !== null && compare(actual, assertion.operator, assertion.expected) };
		}
		if (assertion.type === "duration") {
			const actual = result.durationMs;
			return { ...assertion, actual: `${actual} ms`, passed: actual <= Number(assertion.expected) };
		}
		const actual = result.kind === "response" ? readJsonPath(result.response.body, assertion.path) : undefined;
		return { ...assertion, actual: actual === undefined ? "Missing" : typeof actual === "string" ? actual : JSON.stringify(actual), passed: compare(actual, assertion.operator, assertion.expected) };
	});
}
