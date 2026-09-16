import { AppError } from "../../shared/errors/app-error.js";

const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RESPONSE_BYTES = 1_000_000;
const RUNTIME_CONTROLLED_HEADERS = new Set(["host", "content-length"]);

function buildTargetUrl(urlValue, params) {
	let targetUrl;
	try {
		targetUrl = new URL(urlValue);
	} catch {
		throw new AppError(400, "INVALID_URL", "Enter a valid absolute HTTP or HTTPS URL.");
	}
	if (!["http:", "https:"].includes(targetUrl.protocol)) throw new AppError(400, "INVALID_URL", "Only HTTP and HTTPS URLs are supported.");
	if (targetUrl.username || targetUrl.password) throw new AppError(400, "INVALID_URL", "URLs cannot include credentials.");
	for (const parameter of params) if (parameter.enabled && parameter.key) targetUrl.searchParams.append(parameter.key, parameter.value);
	return targetUrl;
}

function buildRequestHeaders(headerRows, body) {
	const headers = new Headers();
	for (const header of headerRows) {
		if (!header.enabled || !header.key || RUNTIME_CONTROLLED_HEADERS.has(header.key.toLowerCase())) continue;
		headers.append(header.key, header.value);
	}
	if (body.type === "json" && !headers.has("content-type")) headers.set("content-type", "application/json");
	return headers;
}

function validateBody(body) {
	if (body.type === "json" && body.content.trim()) {
		try { JSON.parse(body.content); } catch { throw new AppError(400, "INVALID_JSON", "The JSON request body is not valid."); }
	}
	return body.type === "none" ? undefined : body.content;
}

async function readResponseBody(response) {
	if (!response.body) return { body: "", wasTruncated: false, sizeBytes: 0 };
	const reader = response.body.getReader();
	const chunks = [];
	let sizeBytes = 0;
	let wasTruncated = false;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			const remainingBytes = MAX_RESPONSE_BYTES - sizeBytes;
			if (value.byteLength > remainingBytes) {
				chunks.push(value.slice(0, Math.max(0, remainingBytes)));
				sizeBytes += Math.max(0, remainingBytes);
				wasTruncated = true;
				await reader.cancel();
				break;
			}
			chunks.push(value);
			sizeBytes += value.byteLength;
		}
	} finally { reader.releaseLock(); }
	return { body: new TextDecoder().decode(concatenateChunks(chunks, sizeBytes)), wasTruncated, sizeBytes };
}

function concatenateChunks(chunks, totalBytes) {
	const combined = new Uint8Array(totalBytes);
	let offset = 0;
	for (const chunk of chunks) { combined.set(chunk, offset); offset += chunk.byteLength; }
	return combined;
}

function responseHeadersToObject(headers) {
	return Object.fromEntries([...headers.entries()].sort(([first], [second]) => first.localeCompare(second)));
}

function responseContentType(headers) {
	return headers.get("content-type") || "";
}

export async function executeHttpRequest(draft) {
	const targetUrl = buildTargetUrl(draft.url, draft.params);
	const headers = buildRequestHeaders(draft.headers, draft.body);
	const body = validateBody(draft.body);
	const abortController = new AbortController();
	const timeout = setTimeout(() => abortController.abort("timeout"), DEFAULT_TIMEOUT_MS);
	const startedAt = performance.now();
	try {
		const targetResponse = await fetch(targetUrl, { method: draft.method, headers, body, signal: abortController.signal, redirect: "follow" });
		const capturedBody = await readResponseBody(targetResponse);
		return {
			kind: "response",
			request: { method: draft.method, url: targetUrl.toString() },
			response: { status: targetResponse.status, statusText: targetResponse.statusText, headers: responseHeadersToObject(targetResponse.headers), contentType: responseContentType(targetResponse.headers), ...capturedBody },
			durationMs: Math.round(performance.now() - startedAt),
		};
	} catch (error) {
		const wasTimeout = abortController.signal.aborted && abortController.signal.reason === "timeout";
		return { kind: "error", request: { method: draft.method, url: targetUrl.toString() }, error: { code: wasTimeout ? "REQUEST_TIMEOUT" : "CONNECTION_FAILED", message: wasTimeout ? "The target did not respond within 15 seconds." : "Relay could not connect to the target API." }, durationMs: Math.round(performance.now() - startedAt) };
	} finally { clearTimeout(timeout); }
}
