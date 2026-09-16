export function BrandMark({ size = "normal" }) {
	return <span className={`brand-mark brand-mark-${size}`} aria-hidden="true"><span /><span /></span>;
}
