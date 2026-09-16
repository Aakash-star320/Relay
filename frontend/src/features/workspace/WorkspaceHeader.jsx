import { useEffect, useRef, useState } from "react";
import { MaterialIcon } from "../../shared/components/MaterialIcon.jsx";
import { applyTheme, readTheme } from "../../shared/utils/theme.js";
import { BrandMark } from "./BrandMark.jsx";
import { loadEnvironments } from "../environments/environments.api.js";
import { createEnvironment, deleteEnvironment, updateEnvironment } from "../environments/environments.api.js";
import { Dialog } from "../../shared/components/Dialog.jsx";

function getInitials(name = "") {
	return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("");
}

export function WorkspaceHeader({ account, environments = [], environmentId, onEnvironmentChange, onLogout, onToggleSidebar }) {
	const [menuOpen, setMenuOpen] = useState(false);
	const [theme, setTheme] = useState(() => applyTheme(readTheme()));
	const menuRef = useRef(null);
	const [availableEnvironments, setAvailableEnvironments] = useState(environments);
	const [selectedEnvironmentId, setSelectedEnvironmentId] = useState(environmentId || sessionStorage.getItem("relay-environment-id") || "");
	const [managerOpen, setManagerOpen] = useState(false);
	const [editingEnvironment, setEditingEnvironment] = useState(null);
	useEffect(() => { loadEnvironments().then(setAvailableEnvironments).catch(() => setAvailableEnvironments(environments)); }, [environments]);

	useEffect(() => {
		if (!menuOpen) return undefined;
		const closeMenu = (event) => {
			if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
		};
		const closeOnEscape = (event) => {
			if (event.key === "Escape") setMenuOpen(false);
		};
		document.addEventListener("pointerdown", closeMenu);
		document.addEventListener("keydown", closeOnEscape);
		return () => {
			document.removeEventListener("pointerdown", closeMenu);
			document.removeEventListener("keydown", closeOnEscape);
		};
	}, [menuOpen]);

	const selectTheme = (nextTheme) => setTheme(applyTheme(nextTheme));
	const saveEnvironment = async () => { const name = editingEnvironment?.name?.trim(); const variables = (editingEnvironment?.variables || []).filter((variable) => variable.key.trim()); if (!name) return; const saved = editingEnvironment._id ? await updateEnvironment(editingEnvironment._id, { name, variables }) : await createEnvironment({ name, variables }); const next = editingEnvironment._id ? availableEnvironments.map((item) => item._id === saved._id ? saved : item) : [...availableEnvironments, saved]; setAvailableEnvironments(next); setSelectedEnvironmentId(saved._id); sessionStorage.setItem("relay-environment-id", saved._id); setManagerOpen(false); };

	return (
		<header className="workspace-header">
			<div className="header-brand-group">
				<button className="icon-button" type="button" aria-label="Toggle collections sidebar" onClick={onToggleSidebar}><MaterialIcon>menu</MaterialIcon></button>
				<a className="product-brand" href="#workspace" aria-label="Relay workspace"><BrandMark /><span>Relay</span></a>
			</div>
			<div className="workspace-context">
				<span className="context-label">Personal workspace</span>
				<span className="context-separator" aria-hidden="true" />
				<div className="environment-selector"><label className="environment-button"><span className="sr-only">Selected environment</span><select value={selectedEnvironmentId} onChange={(event) => { const nextId = event.target.value; setSelectedEnvironmentId(nextId); sessionStorage.setItem("relay-environment-id", nextId); onEnvironmentChange?.(nextId || null); }}><option value="">No environment</option>{availableEnvironments.map((environment) => <option key={environment._id} value={environment._id}>{environment.name}</option>)}</select><MaterialIcon size={18}>arrow_drop_down</MaterialIcon></label><button className="environment-manage-button" type="button" onClick={() => { setEditingEnvironment(availableEnvironments.find((item) => item._id === selectedEnvironmentId) || { name: "", variables: [] }); setManagerOpen(true); }}>Manage</button></div>
			</div>
			<div className="account-menu-anchor" ref={menuRef}>
				<button aria-expanded={menuOpen} aria-haspopup="menu" aria-label="Open account menu" className="account-button" type="button" onClick={() => setMenuOpen((current) => !current)}>{getInitials(account.name)}</button>
				{menuOpen && (
					<div className="account-menu" role="menu">
						<div className="account-identity"><span className="account-avatar">{getInitials(account.name)}</span><div><strong>{account.name}</strong><span>{account.email}</span></div></div>
						<div className="theme-control" aria-label="Appearance">
							<button aria-pressed={theme === "light"} type="button" onClick={() => selectTheme("light")}><MaterialIcon size={18}>light_mode</MaterialIcon>Light</button>
							<button aria-pressed={theme === "dark"} type="button" onClick={() => selectTheme("dark")}><MaterialIcon size={18}>dark_mode</MaterialIcon>Dark</button>
						</div>
						<button className="menu-action" role="menuitem" type="button" onClick={onLogout}><MaterialIcon size={18}>logout</MaterialIcon>Sign out</button>
					</div>
				)}
			</div>
			{managerOpen && <Dialog confirmLabel="Save environment" onClose={() => setManagerOpen(false)} onConfirm={saveEnvironment} open title="Environment"><div className="environment-form"><label>Name<input value={editingEnvironment.name} onChange={(event) => setEditingEnvironment((current) => ({ ...current, name: event.target.value }))} /></label>{editingEnvironment.variables.map((variable, index) => <div className="environment-variable" key={index}><input placeholder="Variable" value={variable.key} onChange={(event) => setEditingEnvironment((current) => ({ ...current, variables: current.variables.map((item, itemIndex) => itemIndex === index ? { ...item, key: event.target.value } : item) }))} /><input placeholder="Value" value={variable.value} onChange={(event) => setEditingEnvironment((current) => ({ ...current, variables: current.variables.map((item, itemIndex) => itemIndex === index ? { ...item, value: event.target.value } : item) }))} /><button type="button" onClick={() => setEditingEnvironment((current) => ({ ...current, variables: current.variables.filter((_, itemIndex) => itemIndex !== index) }))}>Remove</button></div>)}<button className="add-row-button" type="button" onClick={() => setEditingEnvironment((current) => ({ ...current, variables: [...current.variables, { key: "", value: "" }] }))}>Add variable</button>{editingEnvironment._id && <button className="danger-text" type="button" onClick={async () => { await deleteEnvironment(editingEnvironment._id); setAvailableEnvironments((current) => current.filter((item) => item._id !== editingEnvironment._id)); setSelectedEnvironmentId(""); sessionStorage.removeItem("relay-environment-id"); setManagerOpen(false); }}>Delete environment</button>}</div></Dialog>}
		</header>
	);
}
