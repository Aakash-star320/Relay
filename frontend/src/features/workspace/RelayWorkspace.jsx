import { useEffect, useRef, useState } from "react";
import { CollectionsSidebar } from "../collections/CollectionsSidebar.jsx";
import { RequestLibrary } from "../collections/RequestLibrary.jsx";
import { createCollection, createSavedRequest, loadWorkspace, updateSavedRequest } from "../collections/collections.api.js";
import { RequestEditorShell } from "../requests/RequestEditorShell.jsx";
import { ResponsePanelShell } from "../responses/ResponsePanelShell.jsx";
import { WorkspaceHeader } from "./WorkspaceHeader.jsx";

const DESKTOP_BREAKPOINT = 920;
const MIN_RESPONSE_HEIGHT_PERCENT = 10;
const MAX_RESPONSE_HEIGHT_PERCENT = 90;

export function RelayWorkspace({ account, onLogout }) {
	const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= DESKTOP_BREAKPOINT);
	const [activeSection, setActiveSection] = useState("collections");
	const [execution, setExecution] = useState(null);
	const [isExecuting, setIsExecuting] = useState(false);
	const [isResizingPanels, setIsResizingPanels] = useState(false);
	const [responseHeight, setResponseHeight] = useState(50);
	const [workspace, setWorkspace] = useState({ collections: [], requests: [] });
	const [savedRequest, setSavedRequest] = useState(null);
	const workspaceMainRef = useRef(null);

	useEffect(() => {
		const mediaQuery = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
		const updateSidebar = (event) => setSidebarOpen(event.matches);
		mediaQuery.addEventListener("change", updateSidebar);
		return () => mediaQuery.removeEventListener("change", updateSidebar);
	}, []);

	const refreshWorkspace = async () => setWorkspace(await loadWorkspace());
	useEffect(() => { refreshWorkspace().catch(() => setWorkspace({ collections: [], requests: [] })); }, []);

	useEffect(() => {
		if (!isResizingPanels) return undefined;
		const stopResizing = () => setIsResizingPanels(false);
		window.addEventListener("pointermove", resizeWorkspacePanels);
		window.addEventListener("pointerup", stopResizing, { once: true });
		window.addEventListener("pointercancel", stopResizing, { once: true });
		return () => {
			window.removeEventListener("pointermove", resizeWorkspacePanels);
			window.removeEventListener("pointerup", stopResizing);
			window.removeEventListener("pointercancel", stopResizing);
		};
	}, [isResizingPanels]);

	const selectSection = (section) => {
		setActiveSection(section);
		if (window.innerWidth < DESKTOP_BREAKPOINT) setSidebarOpen(false);
	};
	const handleCreateCollection = async () => { const name = window.prompt("Collection name"); if (name?.trim()) { await createCollection(name.trim()); await refreshWorkspace(); } };
	const handleSaveRequest = async (draft, currentSavedRequest, collectionId) => { const name = currentSavedRequest?.name || window.prompt("Request name", "New request"); if (!name?.trim()) return; const input = { ...draft, name: name.trim(), collectionId }; const saved = currentSavedRequest ? await updateSavedRequest(currentSavedRequest._id, input) : await createSavedRequest(input); setSavedRequest(saved); await refreshWorkspace(); };

	const resizeWorkspacePanels = (event) => {
		const workspaceBounds = workspaceMainRef.current?.getBoundingClientRect();
		if (!workspaceBounds) return;
		const requestedResponseHeight = workspaceBounds.bottom - event.clientY;
		const requestedPercentage = Math.round((requestedResponseHeight / workspaceBounds.height) * 100);
		setResponseHeight(Math.min(Math.max(requestedPercentage, MIN_RESPONSE_HEIGHT_PERCENT), MAX_RESPONSE_HEIGHT_PERCENT));
	};

	const startPanelResize = (event) => {
		event.preventDefault();
		resizeWorkspacePanels(event);
		setIsResizingPanels(true);
	};

	return (
		<div className="relay-shell" id="workspace">
			<WorkspaceHeader account={account} onLogout={onLogout} onToggleSidebar={() => setSidebarOpen((current) => !current)} />
			<div className={`workspace-body ${sidebarOpen ? "sidebar-visible" : ""}`}>
				<CollectionsSidebar activeSection={activeSection} open={sidebarOpen} onClose={() => setSidebarOpen(false)} onSelectSection={selectSection} workspace={workspace} onCreateCollection={handleCreateCollection} onOpenRequest={setSavedRequest} />
				{activeSection === "requests" ? <main className="workspace-library"><RequestLibrary collections={workspace.collections} requests={workspace.requests} onOpenRequest={(request) => { setSavedRequest(request); setActiveSection("collections"); }} /></main> : <main className={`workspace-main ${isResizingPanels ? "is-resizing" : ""}`} ref={workspaceMainRef} style={{ gridTemplateRows: `minmax(0, ${100 - responseHeight}fr) 12px minmax(0, ${responseHeight}fr)` }}><RequestEditorShell collections={workspace.collections} savedRequest={savedRequest} onNewRequest={() => setSavedRequest(null)} onSaveRequest={handleSaveRequest} onExecutionResult={(result) => { setExecution(result); setIsExecuting(false); }} onExecutionStart={() => { setExecution(null); setIsExecuting(true); }} /><div aria-label="Resize request and response panels" className="workspace-splitter" role="separator" tabIndex={0} onPointerDown={startPanelResize} /><ResponsePanelShell execution={execution} isExecuting={isExecuting} responseHeight={responseHeight} onResponseHeightChange={setResponseHeight} /></main>}
			</div>
		</div>
	);
}
