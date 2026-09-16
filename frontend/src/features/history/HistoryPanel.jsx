import { useEffect, useState } from "react";
import { loadHistory, loadHistoryEntry } from "./history.api.js";

const methods = ["", "GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

function formatTime(value) {
	return new Date(value).toLocaleString();
}

export function HistoryPanel({ onOpenRequest }) {
	const [filters, setFilters] = useState({ method: "", outcome: "" });
	const [page, setPage] = useState({ items: [], nextCursor: null });
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");
	const [selectedEntry, setSelectedEntry] = useState(null);

	const loadPage = async (append = false, cursor = "") => {
		setIsLoading(true);
		try {
			const next = await loadHistory({ ...filters, cursor });
			setPage((current) => ({ items: append ? [...current.items, ...next.items] : next.items, nextCursor: next.nextCursor }));
			setError("");
		} catch (loadError) { setError(loadError.message); }
		finally { setIsLoading(false); }
	};

	useEffect(() => { loadPage(); }, [filters.method, filters.outcome]);
	const inspect = async (historyId) => { try { setSelectedEntry(await loadHistoryEntry(historyId)); } catch (loadError) { setError(loadError.message); } };
	const openEntry = async (historyId) => { try { const entry = await loadHistoryEntry(historyId); onOpenRequest({ ...entry.request, auth: { type: "none" } }); } catch (loadError) { setError(loadError.message); } };
	const updateFilter = (name, value) => setFilters((current) => ({ ...current, [name]: value }));

	return <main className="workspace-library"><section className="request-library history-library" aria-labelledby="history-title"><div className="library-heading"><div><p className="eyebrow">Executions</p><h1 id="history-title">Request history</h1><p>Review safe snapshots of requests and responses sent from this workspace.</p></div><div className="library-controls"><label>Method<select value={filters.method} onChange={(event) => updateFilter("method", event.target.value)}>{methods.map((method) => <option key={method} value={method}>{method || "All methods"}</option>)}</select></label><label>Outcome<select value={filters.outcome} onChange={(event) => updateFilter("outcome", event.target.value)}><option value="">All outcomes</option><option value="response">Responses</option><option value="error">Errors</option></select></label></div></div>{error && <p className="request-validation" role="alert">{error}</p>}{isLoading && page.items.length === 0 ? <div className="library-empty">Loading execution history…</div> : page.items.length === 0 ? <div className="library-empty">No executions match these filters yet.</div> : <div className="request-library-table"><div className="history-row history-labels"><span>Method</span><span>URL</span><span>Result</span><span>When</span><span>Actions</span></div>{page.items.map((entry) => <div className="history-row" key={entry._id}><span className="library-method">{entry.request.method}</span><code>{entry.request.url}</code><span className={entry.outcome === "error" ? "history-error" : "history-response"}>{entry.outcome === "response" ? `${entry.response.status} ${entry.response.statusText}` : entry.error.code}</span><span>{formatTime(entry.createdAt)}</span><span className="history-actions"><button type="button" onClick={() => inspect(entry._id)}>View</button><button type="button" onClick={() => openEntry(entry._id)}>Open request</button></span></div>)}</div>}{page.nextCursor && <button className="secondary-button history-more" disabled={isLoading} type="button" onClick={() => loadPage(true, page.nextCursor)}>{isLoading ? "Loading…" : "Load more"}</button>}{selectedEntry && <section className="history-detail" aria-live="polite"><div><h2>{selectedEntry.request.method} {selectedEntry.request.url}</h2><p>{formatTime(selectedEntry.createdAt)} · {selectedEntry.durationMs ?? "—"} ms</p></div><button className="secondary-button" type="button" onClick={() => setSelectedEntry(null)}>Close</button>{selectedEntry.outcome === "response" ? <><h3>{selectedEntry.response.status} {selectedEntry.response.statusText}</h3><pre>{selectedEntry.response.body || "(empty response body)"}</pre></> : <><h3>{selectedEntry.error.code}</h3><p>{selectedEntry.error.message}</p></>}</section>}</section></main>;
}
