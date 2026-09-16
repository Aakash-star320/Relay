import { MaterialIcon } from "../../shared/components/MaterialIcon.jsx";
import { createKeyValueRow } from "./request-draft.js";

export function KeyValueEditor({ label, rows, onRowsChange }) {
	const updateRow = (rowId, changes) => onRowsChange((currentRows) => currentRows.map((row) => row.id === rowId ? { ...row, ...changes } : row));
	const removeRow = (rowId) => onRowsChange((currentRows) => currentRows.filter((row) => row.id !== rowId));

	return <div className="key-value-editor">
		<div className="key-value-columns"><span>{label}</span><span>Value</span><span>Enabled</span><span className="sr-only">Actions</span></div>
		{rows.map((row) => <div className="key-value-row" key={row.id}>
			<input aria-label={`${label} name`} type="text" value={row.key} onChange={(event) => updateRow(row.id, { key: event.target.value })} placeholder={label} />
			<input aria-label={`${label} value`} type="text" value={row.value} onChange={(event) => updateRow(row.id, { value: event.target.value })} placeholder="Value" />
			<label className="row-toggle"><input aria-label={`Enable ${label.toLowerCase()} ${row.key || "row"}`} checked={row.enabled} type="checkbox" onChange={(event) => updateRow(row.id, { enabled: event.target.checked })} /><span /></label>
			<button className="row-delete" aria-label={`Remove ${label.toLowerCase()} row`} type="button" onClick={() => removeRow(row.id)}><MaterialIcon size={17}>close</MaterialIcon></button>
		</div>)}
		<button className="add-row-button" type="button" onClick={() => onRowsChange((currentRows) => [...currentRows, createKeyValueRow()])}><MaterialIcon size={17}>add</MaterialIcon>Add {label.toLowerCase()}</button>
	</div>;
}
