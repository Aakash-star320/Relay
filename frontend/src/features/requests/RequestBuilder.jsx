import { useEffect, useRef, useState } from "react";
import { MaterialIcon } from "../../shared/components/MaterialIcon.jsx";
import { KeyValueEditor } from "./KeyValueEditor.jsx";
import { MethodSelector } from "./MethodSelector.jsx";
import { cancelExecution, executeRequest } from "./request.api.js";
import { createInitialRequestDraft, HTTP_METHODS } from "./request-draft.js";

const editorTabs = ["Params", "Headers", "Body", "Auth", "Assertions", "Extraction"];

function validateDraft(draft) {
	if (!draft.url.trim()) return "Enter a URL to send a request.";
	if (draft.body.type === "json" && draft.body.content.trim()) {
		try { JSON.parse(draft.body.content); } catch { return "Fix the JSON request body before sending."; }
	}
	return "";
}

export function RequestBuilder({ environmentId, onDirtyChange, onDraftChange, onExecutionResult, onExecutionStart, savedRequest, onSaveRequest, onSaveCopy, onNewRequest, collections }) {
	const [draft, setDraft] = useState(createInitialRequestDraft);
	const [activeTab, setActiveTab] = useState("Params");
	const [validationMessage, setValidationMessage] = useState("");
	const [isExecuting, setIsExecuting] = useState(false);
	const [isCancelling, setIsCancelling] = useState(false);
	const [collectionId, setCollectionId] = useState("");
	const executionLock = useRef(false);
	const activeExecutionId = useRef(null);
	const savedDraftRef = useRef("");
	const tabContentRef = useRef(null);
	useEffect(() => { const nextDraft = savedRequest ? { method: savedRequest.method, url: savedRequest.url, params: savedRequest.params, headers: savedRequest.headers, body: savedRequest.body, auth: savedRequest.auth || { type: "inherit" }, assertions: savedRequest.assertions || [], extractions: savedRequest.extractions || [] } : createInitialRequestDraft(); savedDraftRef.current = JSON.stringify(nextDraft); setDraft(nextDraft); setCollectionId(savedRequest?.collectionId || ""); }, [savedRequest]);
	useEffect(() => { onDirtyChange(JSON.stringify(draft) !== savedDraftRef.current); }, [draft, onDirtyChange]);
	useEffect(() => { onDraftChange(draft); }, [draft, onDraftChange]);
	useEffect(() => {
		// In a short split pane, keep the selected controls visible rather than leaving them below the fold.
		tabContentRef.current?.scrollIntoView({ block: "nearest" });
	}, [activeTab]);

	const updateDraft = (field, value) => setDraft((currentDraft) => ({ ...currentDraft, [field]: value }));
	const updateBody = (changes) => setDraft((currentDraft) => ({ ...currentDraft, body: { ...currentDraft.body, ...changes } }));
	const updateRows = (field, transformRows) => setDraft((currentDraft) => ({ ...currentDraft, [field]: transformRows(currentDraft[field]) }));
	const updateAssertion = (index, changes) => setDraft((current) => ({ ...current, assertions: current.assertions.map((assertion, assertionIndex) => assertionIndex === index ? { ...assertion, ...changes } : assertion) }));
	const updateExtraction = (index, changes) => setDraft((current) => ({ ...current, extractions: current.extractions.map((extraction, extractionIndex) => extractionIndex === index ? { ...extraction, ...changes } : extraction) }));

	const sendRequest = async () => {
		if (executionLock.current) return;
		const nextValidationMessage = validateDraft(draft);
		if (nextValidationMessage) { setValidationMessage(nextValidationMessage); return; }
		executionLock.current = true;
		const executionId = crypto.randomUUID();
		activeExecutionId.current = executionId;
		setIsExecuting(true);
		setValidationMessage("");
		onExecutionStart();
		try {
			const result = await executeRequest(draft, environmentId || sessionStorage.getItem("relay-environment-id") || null, collectionId || null, executionId);
			if (activeExecutionId.current === executionId) onExecutionResult(result);
		} catch (error) {
			if (activeExecutionId.current === executionId) onExecutionResult({ kind: "error", error: { code: "RELAY_ERROR", message: error.message }, durationMs: null });
		} finally {
			if (activeExecutionId.current === executionId) {
				activeExecutionId.current = null;
				executionLock.current = false;
				setIsCancelling(false);
				setIsExecuting(false);
			}
		}
	};

	const cancelRequest = async () => {
		const executionId = activeExecutionId.current;
		if (!executionId || isCancelling) return;
		setIsCancelling(true);
		try {
			const result = await cancelExecution(executionId);
			if (!result.cancelled || activeExecutionId.current !== executionId) return;
			activeExecutionId.current = null;
			executionLock.current = false;
			setIsExecuting(false);
			onExecutionResult({ kind: "error", error: { code: "REQUEST_CANCELLED", message: "The request was cancelled." }, durationMs: null });
		} catch (error) {
			if (activeExecutionId.current === executionId) setValidationMessage(error.message);
		} finally { setIsCancelling(false); }
	};

	let requestTabContent = activeTab === "Params"
		? <KeyValueEditor label="Parameter" rows={draft.params} onRowsChange={(transformRows) => updateRows("params", transformRows)} />
		: activeTab === "Headers"
			? <KeyValueEditor label="Header" rows={draft.headers} onRowsChange={(transformRows) => updateRows("headers", transformRows)} />
			: activeTab === "Body"
				? <div className="request-body-editor"><label>Body type<select value={draft.body.type} onChange={(event) => updateBody({ type: event.target.value })}><option value="none">None</option><option value="json">JSON</option><option value="text">Text</option></select></label>{draft.body.type !== "none" && <label>Content<textarea aria-label="Request body content" spellCheck="false" value={draft.body.content} placeholder={draft.body.type === "json" ? '{\n  "key": "value"\n}' : "Enter text"} onChange={(event) => updateBody({ content: event.target.value })} /></label>}</div>
			: activeTab === "Auth" ? <div className="request-body-editor"><label>Authentication<select value={draft.auth?.type || "none"} onChange={(event) => updateDraft("auth", { ...draft.auth, type: event.target.value })}><option value="inherit">Inherit collection default</option><option value="none">No auth</option><option value="bearer">Bearer token</option><option value="basic">Basic auth</option><option value="apiKey">API key</option></select></label>{draft.auth?.type === "bearer" && <label>Token<input value={draft.auth.token || ""} onChange={(event) => updateDraft("auth", { ...draft.auth, token: event.target.value })} placeholder="{{token}}" /></label>}{draft.auth?.type === "basic" && <><label>Username<input value={draft.auth.username || ""} onChange={(event) => updateDraft("auth", { ...draft.auth, username: event.target.value })} /></label><label>Password<input type="password" value={draft.auth.password || ""} onChange={(event) => updateDraft("auth", { ...draft.auth, password: event.target.value })} /></label></>}{draft.auth?.type === "apiKey" && <><label>Key<input value={draft.auth.key || ""} onChange={(event) => updateDraft("auth", { ...draft.auth, key: event.target.value })} placeholder="X-API-Key" /></label><label>Value<input value={draft.auth.value || ""} onChange={(event) => updateDraft("auth", { ...draft.auth, value: event.target.value })} placeholder="{{apiKey}}" /></label><label>Add to<select value={draft.auth.addTo || "header"} onChange={(event) => updateDraft("auth", { ...draft.auth, addTo: event.target.value })}><option value="header">Header</option><option value="query">Query parameter</option></select></label></>}</div> : <div className="request-body-editor"><p className="assertion-help">Checks run on Relay after a response is fully captured.</p>{draft.assertions.map((assertion, index) => <div className="assertion-row" key={assertion.id}><select value={assertion.type} onChange={(event) => updateAssertion(index, { type: event.target.value, operator: event.target.value === "duration" ? "equals" : "equals", path: "", expected: "" })}><option value="status">Status</option><option value="duration">Response time</option><option value="json">JSON field</option></select>{assertion.type === "json" && <input placeholder="data.status" value={assertion.path || ""} onChange={(event) => updateAssertion(index, { path: event.target.value })} />}{assertion.type !== "duration" && <select value={assertion.operator} onChange={(event) => updateAssertion(index, { operator: event.target.value })}><option value="equals">equals</option><option value="notEquals">does not equal</option><option value="contains">contains</option><option value="exists">exists</option></select>}<input placeholder={assertion.type === "duration" ? "Maximum ms" : assertion.type === "status" ? "200" : "Expected value"} value={assertion.expected} disabled={assertion.type === "json" && assertion.operator === "exists"} onChange={(event) => updateAssertion(index, { expected: event.target.value })} /><button type="button" onClick={() => setDraft((current) => ({ ...current, assertions: current.assertions.filter((_, assertionIndex) => assertionIndex !== index) }))}>Remove</button></div>)}<button className="add-row-button" type="button" onClick={() => setDraft((current) => ({ ...current, assertions: [...current.assertions, { id: crypto.randomUUID(), type: "status", operator: "equals", expected: "200" }] }))}>Add assertion</button></div>;

	if (activeTab === "Extraction") requestTabContent = <div className="request-body-editor"><p className="assertion-help">Extract JSON response fields into variables available to later requests in this collection run.</p>{draft.extractions.map((extraction, index) => <div className="assertion-row" key={extraction.id}><input placeholder="JSON path, e.g. data.id" value={extraction.path} onChange={(event) => updateExtraction(index, { path: event.target.value })} /><input placeholder="Variable name, e.g. orderId" value={extraction.variable} onChange={(event) => updateExtraction(index, { variable: event.target.value })} /><button type="button" onClick={() => setDraft((current) => ({ ...current, extractions: current.extractions.filter((_, extractionIndex) => extractionIndex !== index) }))}>Remove</button></div>)}<button className="add-row-button" type="button" onClick={() => setDraft((current) => ({ ...current, extractions: [...current.extractions, { id: crypto.randomUUID(), path: "", variable: "" }] }))}>Add extraction</button></div>;

	return <section className="request-editor" aria-labelledby="request-editor-title">
		<div className="request-tab-strip"><div className="request-tab active"><span className="method-indicator">{draft.method}</span><span>{savedRequest?.name || "Untitled request"}</span><span className="unsaved-indicator" aria-label="Unsaved" /></div><button className="new-tab-button" type="button" aria-label="Create new request" onClick={onNewRequest}><MaterialIcon size={18}>add</MaterialIcon></button></div>
		<div className="request-editor-content">
			<div className="request-title-row"><div><p className="eyebrow">Request</p><h1 id="request-editor-title">{savedRequest?.name || "Untitled request"}</h1></div><div className="save-actions"><label>Save to<select value={collectionId} onChange={(event) => setCollectionId(event.target.value)}><option value="">Unfiled requests</option>{collections.map((collection) => <option key={collection._id} value={collection._id}>{collection.name}</option>)}</select></label>{savedRequest && <button className="secondary-button" type="button" onClick={() => onSaveCopy(draft, savedRequest, collectionId || null)}>Save as copy</button>}<button className="secondary-button" type="button" onClick={() => onSaveRequest(draft, savedRequest, collectionId || null)}>Save</button></div></div>
			<div className="request-address" aria-label="Request address"><MethodSelector methods={HTTP_METHODS} value={draft.method} onChange={(method) => updateDraft("method", method)} /><label className="url-field"><span className="sr-only">Request URL</span><input value={draft.url} placeholder="Enter a URL to send a request" type="url" onChange={(event) => updateDraft("url", event.target.value)} /></label>{isExecuting ? <button className="cancel-button" disabled={isCancelling} type="button" onClick={cancelRequest}>{isCancelling ? "Cancelling…" : "Cancel"}</button> : <button className="send-button" type="button" onClick={sendRequest}>Send</button>}</div>
			{validationMessage && <p className="request-validation" role="alert">{validationMessage}</p>}
			<div className="editor-tabs" role="tablist" aria-label="Request configuration">{editorTabs.map((tab) => <button aria-selected={activeTab === tab} className={activeTab === tab ? "active" : ""} key={tab} role="tab" type="button" onClick={() => setActiveTab(tab)}>{tab}</button>)}</div>
			<div className="request-tab-content" ref={tabContentRef} role="tabpanel">{requestTabContent}</div>
		</div>
	</section>;
}
