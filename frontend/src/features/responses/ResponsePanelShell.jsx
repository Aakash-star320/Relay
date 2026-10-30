import { useMemo, useState } from "react";
import { MaterialIcon } from "../../shared/components/MaterialIcon.jsx";

const responseTabs = ["Body", "Headers", "Assertions"];

function formatResponseBody(body, contentType) {
	if (!body) return "";
	if (contentType.includes("json")) {
		try { return JSON.stringify(JSON.parse(body), null, 2); } catch { return body; }
	}
	return body;
}

function formatSize(sizeBytes) {
	if (sizeBytes === null || sizeBytes === undefined) return "—";
	return sizeBytes < 1024 ? `${sizeBytes} B` : `${(sizeBytes / 1024).toFixed(1)} KB`;
}

function responseHeading(execution, isExecuting) {
	if (isExecuting) return "Sending request…";
	if (execution?.kind === "response") return `${execution.response.status} ${execution.response.statusText}`;
	if (execution?.error?.code === "REQUEST_CANCELLED") return "Request cancelled";
	if (execution) return "Request could not be completed";
	return "No response yet";
}

function renderSearchableBody(body, searchTerm) {
	if (!searchTerm) return body;
	const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return body.split(new RegExp(`(${escapedTerm})`, "gi")).map((segment, index) => segment.toLowerCase() === searchTerm.toLowerCase() ? <mark key={index}>{segment}</mark> : segment);
}

export function ResponsePanelShell({ execution, isExecuting, responseHeight, onResponseHeightChange }) {
	const [activeTab, setActiveTab] = useState("Body");
	const [bodyMode, setBodyMode] = useState("formatted");
	const [searchTerm, setSearchTerm] = useState("");
	const [copyState, setCopyState] = useState("");
	const isResponse = execution?.kind === "response";
	const response = execution?.response;
	const displayedBody = useMemo(() => bodyMode === "formatted" ? formatResponseBody(response?.body || "", response?.contentType || "") : response?.body || "", [bodyMode, response?.body, response?.contentType]);
	const searchCount = searchTerm ? displayedBody.toLowerCase().split(searchTerm.toLowerCase()).length - 1 : 0;

	const copyResponse = async () => {
		try {
			await navigator.clipboard.writeText(displayedBody);
			setCopyState("Copied");
			window.setTimeout(() => setCopyState(""), 1600);
		} catch { setCopyState("Copy unavailable"); }
	};

	return <section className="response-panel" aria-labelledby="response-panel-title">
		<div className="response-heading"><div><p className="eyebrow">Response</p><h2 id="response-panel-title">{responseHeading(execution, isExecuting)}</h2></div><div className="response-heading-actions"><div className="response-metrics" aria-label="Response metrics"><span>Status {response?.status ?? "—"}</span><span>Time {execution?.durationMs === null || execution?.durationMs === undefined ? "—" : `${execution.durationMs} ms`}</span><span>Size {formatSize(response?.sizeBytes)}</span></div><label className="response-height-control">Response height<input aria-label="Response panel height" max="90" min="10" type="range" value={responseHeight} onChange={(event) => onResponseHeightChange(Number(event.target.value))} /></label></div></div>
		<div className="response-tabs" role="tablist" aria-label="Response details">{responseTabs.map((tab) => <button disabled={tab === "Assertions" && !execution?.assertions?.length} aria-selected={activeTab === tab} className={activeTab === tab ? "active" : ""} key={tab} role="tab" type="button" onClick={() => setActiveTab(tab)}>{tab}</button>)}</div>
		<div className="response-content" role="tabpanel">
			{isExecuting && <div className="response-empty"><span className="response-glyph"><MaterialIcon size={26}>sync</MaterialIcon></span><strong>Relay is contacting the target API</strong><p>You can cancel from the request bar while Relay waits for the target.</p></div>}
			{!isExecuting && !execution && <div className="response-empty"><span className="response-glyph"><MaterialIcon size={26}>sync</MaterialIcon></span><strong>Send a request to inspect its response</strong><p>Status, timing, headers, and the formatted response body will appear here.</p></div>}
			{!isExecuting && execution?.kind === "error" && <div className={`response-empty ${execution.error.code === "REQUEST_CANCELLED" ? "" : "response-error"}`}><span className="response-glyph"><MaterialIcon size={26}>{execution.error.code === "REQUEST_CANCELLED" ? "sync" : "error"}</MaterialIcon></span><strong>{execution.error.message}</strong><p>{execution.error.code}{execution.durationMs !== null ? ` · ${execution.durationMs} ms` : ""}</p></div>}
			{!isExecuting && isResponse && activeTab === "Body" && <div className="response-body"><div className="response-body-meta"><span>{response.contentType || "No content type"}</span>{response.wasTruncated && <span className="truncated-notice">Captured first 1 MB of this response</span>}<div className="response-body-actions"><div className="body-mode-toggle" aria-label="Response body mode"><button className={bodyMode === "formatted" ? "active" : ""} type="button" onClick={() => setBodyMode("formatted")}>Formatted</button><button className={bodyMode === "raw" ? "active" : ""} type="button" onClick={() => setBodyMode("raw")}>Raw</button></div><label className="response-search"><span className="sr-only">Search response</span><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Find in response" />{searchTerm && <span>{searchCount}</span>}</label><button className="response-copy-button" type="button" onClick={copyResponse}>{copyState || "Copy"}</button></div></div><pre>{renderSearchableBody(displayedBody || "(empty response body)", searchTerm)}</pre></div>}
			{!isExecuting && isResponse && activeTab === "Headers" && <div className="response-headers">{Object.entries(response.headers).map(([name, value]) => <div key={name}><span>{name}</span><code>{value}</code></div>)}</div>}
			{!isExecuting && execution?.assertions?.length > 0 && activeTab === "Assertions" && <div className="response-headers">{execution.assertions.map((assertion) => <div className={assertion.passed ? "assertion-passed" : "assertion-failed"} key={assertion.id}><span>{assertion.passed ? "Passed" : "Failed"}</span><code>{assertion.type === "json" ? assertion.path : assertion.type} {assertion.type === "duration" ? `under ${assertion.expected} ms` : `${assertion.operator} ${assertion.expected}`} · actual: {assertion.actual}</code></div>)}</div>}
		</div>
	</section>;
}
