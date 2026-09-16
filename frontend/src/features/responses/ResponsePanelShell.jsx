import { useState } from "react";
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

export function ResponsePanelShell({ execution, isExecuting, responseHeight, onResponseHeightChange }) {
	const [activeTab, setActiveTab] = useState("Body");
	const isResponse = execution?.kind === "response";
	const response = execution?.response;
	const heading = isExecuting ? "Sending request…" : isResponse ? `${response.status} ${response.statusText}` : execution ? "Request could not be completed" : "No response yet";
	return <section className="response-panel" aria-labelledby="response-panel-title">
		<div className="response-heading"><div><p className="eyebrow">Response</p><h2 id="response-panel-title">{heading}</h2></div><div className="response-heading-actions"><div className="response-metrics" aria-label="Response metrics"><span>Status {response?.status ?? "—"}</span><span>Time {execution?.durationMs === null || execution?.durationMs === undefined ? "—" : `${execution.durationMs} ms`}</span><span>Size {formatSize(response?.sizeBytes)}</span></div><label className="response-height-control">Response height<input aria-label="Response panel height" max="90" min="10" type="range" value={responseHeight} onChange={(event) => onResponseHeightChange(Number(event.target.value))} /></label></div></div>
		<div className="response-tabs" role="tablist" aria-label="Response details">{responseTabs.map((tab) => <button disabled={tab === "Assertions"} aria-selected={activeTab === tab} className={activeTab === tab ? "active" : ""} key={tab} role="tab" type="button" onClick={() => setActiveTab(tab)}>{tab}</button>)}</div>
		<div className="response-content" role="tabpanel">
			{isExecuting && <div className="response-empty"><span className="response-glyph"><MaterialIcon size={26}>sync</MaterialIcon></span><strong>Relay is contacting the target API</strong><p>The response will appear here when the target responds.</p></div>}
			{!isExecuting && !execution && <div className="response-empty"><span className="response-glyph"><MaterialIcon size={26}>sync</MaterialIcon></span><strong>Send a request to inspect its response</strong><p>Status, timing, headers, and the formatted response body will appear here.</p></div>}
			{!isExecuting && execution?.kind === "error" && <div className="response-empty response-error"><span className="response-glyph"><MaterialIcon size={26}>error</MaterialIcon></span><strong>{execution.error.message}</strong><p>{execution.error.code}{execution.durationMs !== null ? ` · ${execution.durationMs} ms` : ""}</p></div>}
			{!isExecuting && isResponse && activeTab === "Body" && <div className="response-body"><div className="response-body-meta"><span>{response.contentType || "No content type"}</span>{response.wasTruncated && <span className="truncated-notice">Captured first 1 MB of this response</span>}</div><pre>{formatResponseBody(response.body, response.contentType) || "(empty response body)"}</pre></div>}
			{!isExecuting && isResponse && activeTab === "Headers" && <div className="response-headers">{Object.entries(response.headers).map(([name, value]) => <div key={name}><span>{name}</span><code>{value}</code></div>)}</div>}
		</div>
	</section>;
}
