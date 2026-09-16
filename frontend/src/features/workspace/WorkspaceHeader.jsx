import { useEffect, useRef, useState } from "react";
import { MaterialIcon } from "../../shared/components/MaterialIcon.jsx";
import { applyTheme, readTheme } from "../../shared/utils/theme.js";
import { BrandMark } from "./BrandMark.jsx";

function getInitials(name = "") {
	return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("");
}

export function WorkspaceHeader({ account, onLogout, onToggleSidebar }) {
	const [menuOpen, setMenuOpen] = useState(false);
	const [theme, setTheme] = useState(() => applyTheme(readTheme()));
	const menuRef = useRef(null);

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

	return (
		<header className="workspace-header">
			<div className="header-brand-group">
				<button className="icon-button" type="button" aria-label="Toggle collections sidebar" onClick={onToggleSidebar}><MaterialIcon>menu</MaterialIcon></button>
				<a className="product-brand" href="#workspace" aria-label="Relay workspace"><BrandMark /><span>Relay</span></a>
			</div>
			<div className="workspace-context">
				<span className="context-label">Personal workspace</span>
				<span className="context-separator" aria-hidden="true" />
				<button className="environment-button" disabled type="button"><span>No environment</span><MaterialIcon size={18}>arrow_drop_down</MaterialIcon></button>
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
		</header>
	);
}
