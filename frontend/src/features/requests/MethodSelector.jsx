import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MaterialIcon } from "../../shared/components/MaterialIcon.jsx";

export function MethodSelector({ methods, value, onChange }) {
	const [isOpen, setIsOpen] = useState(false);
	const [menuPosition, setMenuPosition] = useState(null);
	const selectorRef = useRef(null);
	const triggerRef = useRef(null);
	const menuRef = useRef(null);

	useEffect(() => {
		const closeWhenFocusLeaves = (event) => {
			if (!selectorRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setIsOpen(false);
		};
		document.addEventListener("pointerdown", closeWhenFocusLeaves);
		return () => document.removeEventListener("pointerdown", closeWhenFocusLeaves);
	}, []);

	const openMenu = () => {
		const triggerBounds = triggerRef.current?.getBoundingClientRect();
		if (!triggerBounds) return;
		setMenuPosition({ top: triggerBounds.bottom + 7, left: triggerBounds.left, width: Math.max(triggerBounds.width, 172) });
		setIsOpen(true);
	};

	const chooseMethod = (method) => { onChange(method); setIsOpen(false); };
	const handleKeyDown = (event) => {
		if (event.key === "Escape") setIsOpen(false);
		if (["Enter", " ", "ArrowDown"].includes(event.key)) { event.preventDefault(); openMenu(); }
	};

	const menu = isOpen && menuPosition ? <div aria-label="HTTP method" className="method-selector-menu" ref={menuRef} role="listbox" style={menuPosition}>{methods.map((method) => <button aria-selected={method === value} className={method === value ? "selected" : ""} key={method} role="option" type="button" onClick={() => chooseMethod(method)}>{method}{method === value && <MaterialIcon size={17}>check</MaterialIcon>}</button>)}</div> : null;

	return <div className="method-selector" ref={selectorRef}>
		<button aria-expanded={isOpen} aria-haspopup="listbox" className="method-selector-trigger" ref={triggerRef} type="button" onClick={() => isOpen ? setIsOpen(false) : openMenu()} onKeyDown={handleKeyDown}>{value}<MaterialIcon size={19}>{isOpen ? "expand_less" : "expand_more"}</MaterialIcon></button>
		{menu && createPortal(menu, document.body)}
	</div>;
}
