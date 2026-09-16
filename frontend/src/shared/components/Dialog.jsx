import { useEffect, useRef } from "react";

/** A focused modal for destructive and naming actions throughout the workspace. */
export function Dialog({ children, confirmLabel = "Confirm", isDanger = false, onClose, onConfirm, open, title }) {
	const dialogRef = useRef(null);
	const closeHandlerRef = useRef(onClose);
	closeHandlerRef.current = onClose;
	useEffect(() => {
		if (!open) return undefined;
		const closeOnEscape = (event) => { if (event.key === "Escape") closeHandlerRef.current(); };
		window.addEventListener("keydown", closeOnEscape);
		dialogRef.current?.focus();
		return () => window.removeEventListener("keydown", closeOnEscape);
	}, [open]);
	if (!open) return null;
	return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section aria-modal="true" aria-labelledby="dialog-title" className="dialog" role="dialog" ref={dialogRef} tabIndex={-1}><h2 id="dialog-title">{title}</h2><div className="dialog-content">{children}</div><div className="dialog-actions"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button>{onConfirm && <button className={isDanger ? "danger-button" : "primary-button"} type="button" onClick={onConfirm}>{confirmLabel}</button>}</div></section></div>;
}
