function formatUpdatedAt(value) {
	if (!value) return "—";
	const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60_000));
	return minutes < 1 ? "Just now" : minutes < 60 ? `${minutes} min ago` : new Date(value).toLocaleDateString();
}

export function RequestLibrary({ collections, requests, onOpenRequest }) {
	const collectionNames = new Map(collections.map((collection) => [collection._id, collection.name]));
	return <section className="request-library" aria-labelledby="request-library-title"><div className="library-heading"><div><p className="eyebrow">Saved requests</p><h1 id="request-library-title">All requests</h1><p>Open and manage saved API requests from one place.</p></div><span>{requests.length} total</span></div><div className="request-library-table"><div className="library-row library-labels"><span>Method</span><span>Name</span><span>URL</span><span>Collection</span><span>Updated</span></div>{requests.length === 0 ? <div className="library-empty">No saved requests yet. Save a draft to add one here.</div> : requests.map((savedRequest) => <button className="library-row" key={savedRequest._id} type="button" onClick={() => onOpenRequest(savedRequest)}><span className="library-method">{savedRequest.method}</span><strong>{savedRequest.name}</strong><code>{savedRequest.url}</code><span>{collectionNames.get(savedRequest.collectionId) || "Unfiled"}</span><span>{formatUpdatedAt(savedRequest.updatedAt)}</span></button>)}</div></section>;
}
