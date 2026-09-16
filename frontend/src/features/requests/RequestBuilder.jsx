import { useEffect, useRef, useState } from "react";
import { MaterialIcon } from "../../shared/components/MaterialIcon.jsx";
import { KeyValueEditor } from "./KeyValueEditor.jsx";
import { MethodSelector } from "./MethodSelector.jsx";
import { executeRequest } from "./request.api.js";
import { createInitialRequestDraft, HTTP_METHODS } from "./request-draft.js";

const editorTabs = ["Params", "Headers", "Body", "Auth", "Assertions"];

function validateDraft(draft) {
	if (!draft.url.trim()) return "Enter a URL to send a request.";
	if (draft.body.type === "json" && draft.body.content.trim()) {
		try { JSON.parse(draft.body.content); } catch { return "Fix the JSON request body before sending."; }
	}
	return "";
}

export function RequestBuilder({ onExecutionResult, onExecutionStart, savedRequest, onSaveRequest, onNewRequest, collections }) {
	const [draft, setDraft] = useState(createInitialRequestDraft);
	const [activeTab, setActiveTab] = useState("Params");
	const [validationMessage, setValidationMessage] = useState("");
	const [isExecuting, setIsExecuting] = useState(false);
	const [collectionId, setCollectionId] = useState("");
	const executionLock = useRef(false);
	useEffect(() => { setDraft(savedRequest ? { method: savedRequest.method, url: savedRequest.url, params: savedRequest.params, headers: savedRequest.headers, body: savedRequest.body } : createInitialRequestDraft()); setCollectionId(savedRequest?.collectionId || ""); }, [savedRequest]);

	const updateDraft = (field, value) => setDraft((currentDraft) => ({ ...currentDraft, [field]: value }));
	const updateBody = (changes) => setDraft((currentDraft) => ({ ...currentDraft, body: { ...currentDraft.body, ...changes } }));
	const updateRows = (field, transformRows) => setDraft((currentDraft) => ({ ...currentDraft, [field]: transformRows(currentDraft[field]) }));

	const sendRequest = async () => {
		if (executionLock.current) return;
		const nextValidationMessage = validateDraft(draft);
		if (nextValidationMessage) { setValidationMessage(nextValidationMessage); return; }
		executionLock.current = true;
		setIsExecuting(true);
		setValidationMessage("");
		onExecutionStart();
		try { onExecutionResult(await executeRequest(draft)); }
		catch (error) { onExecutionResult({ kind: "error", error: { code: "RELAY_ERROR", message: error.message }, durationMs: null }); }
		finally { executionLock.current = false; setIsExecuting(false); }
	};

	const requestTabContent = activeTab === "Params"
		? <KeyValueEditor label="Parameter" rows={draft.params} onRowsChange={(transformRows) => updateRows("params", transformRows)} />
		: activeTab === "Headers"
			? <KeyValueEditor label="Header" rows={draft.headers} onRowsChange={(transformRows) => updateRows("headers", transformRows)} />
			: activeTab === "Body"
				? <div className="request-body-editor"><label>Body type<select value={draft.body.type} onChange={(event) => updateBody({ type: event.target.value })}><option value="none">None</option><option value="json">JSON</option><option value="text">Text</option></select></label>{draft.body.type !== "none" && <label>Content<textarea aria-label="Request body content" spellCheck="false" value={draft.body.content} placeholder={draft.body.type === "json" ? '{\n  "key": "value"\n}' : "Enter text"} onChange={(event) => updateBody({ content: event.target.value })} /></label>}</div>
				: <div className="editor-empty"><span className="empty-kicker">{activeTab}</span><h2>Available in a later workspace step</h2><p>{activeTab === "Auth" ? "Authentication is added after saved requests and environments." : "Assertions are added with the collection runner."}</p></div>;

	return <section className="request-editor" aria-labelledby="request-editor-title">
		<div className="request-tab-strip"><div className="request-tab active"><span className="method-indicator">{draft.method}</span><span>{savedRequest?.name || "Untitled request"}</span><span className="unsaved-indicator" aria-label="Unsaved" /></div><button className="new-tab-button" type="button" aria-label="Create new request" onClick={onNewRequest}><MaterialIcon size={18}>add</MaterialIcon></button></div>
		<div className="request-editor-content">
			<div className="request-title-row"><div><p className="eyebrow">Request</p><h1 id="request-editor-title">{savedRequest?.name || "Untitled request"}</h1></div><div className="save-actions"><label>Save to<select value={collectionId} onChange={(event) => setCollectionId(event.target.value)}><option value="">Unfiled requests</option>{collections.map((collection) => <option key={collection._id} value={collection._id}>{collection.name}</option>)}</select></label><button className="secondary-button" type="button" onClick={() => onSaveRequest(draft, savedRequest, collectionId || null)}>Save</button></div></div>
			<div className="request-address" aria-label="Request address"><MethodSelector methods={HTTP_METHODS} value={draft.method} onChange={(method) => updateDraft("method", method)} /><label className="url-field"><span className="sr-only">Request URL</span><input value={draft.url} placeholder="Enter a URL to send a request" type="url" onChange={(event) => updateDraft("url", event.target.value)} /></label><button className="send-button" disabled={isExecuting} type="button" onClick={sendRequest}>{isExecuting ? "Sending…" : "Send"}</button></div>
			{validationMessage && <p className="request-validation" role="alert">{validationMessage}</p>}
			<div className="editor-tabs" role="tablist" aria-label="Request configuration">{editorTabs.map((tab) => <button aria-selected={activeTab === tab} className={activeTab === tab ? "active" : ""} key={tab} role="tab" type="button" onClick={() => setActiveTab(tab)}>{tab}</button>)}</div>
			<div className="request-tab-content" role="tabpanel">{requestTabContent}</div>
		</div>
	</section>;
}
