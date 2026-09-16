import { useState } from "react";
import { BrandMark } from "../workspace/BrandMark.jsx";

export function WorkspaceLogin({ error = "", loading = false, onLogin = () => {} }) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const submit = (event) => {
		event.preventDefault();
		onLogin(email.trim(), password);
	};

	return (
		<main className="login-page">
			<section className="login-introduction" aria-labelledby="login-product-title">
				<div className="login-brand">
					<BrandMark size="large" />
					<span>Relay</span>
				</div>
				<p className="eyebrow">API workspace</p>
				<h1 id="login-product-title">Build, inspect, and automate HTTP requests.</h1>
				<p className="login-description">
					Keep collections, environments, execution history, and response checks together in one focused developer workspace.
				</p>
				<div className="login-signal" aria-hidden="true">
					<span className="signal-method">POST</span>
					<span className="signal-path">/api/orders</span>
					<span className="signal-status">201 Created</span>
				</div>
			</section>

			<section className="login-panel" aria-labelledby="workspace-login-title">
				<div className="login-panel-heading">
					<p className="eyebrow">Welcome back</p>
					<h2 id="workspace-login-title">Sign in to your workspace</h2>
					<p>Use one of the seeded workspace accounts to continue.</p>
				</div>
				<form onSubmit={submit}>
					<label className="field-label" htmlFor="workspace-email">Email address</label>
					<input autoComplete="username" className="text-field" data-testid="email-input" disabled={loading} id="workspace-email" inputMode="email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
					<label className="field-label" htmlFor="workspace-password">Password</label>
					<input autoComplete="current-password" className="text-field" data-testid="password-input" disabled={loading} id="workspace-password" required type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
					{error && <p className="form-error" role="alert">{error}</p>}
					<button className="primary-button login-submit" disabled={loading} type="submit">{loading ? "Signing in…" : "Sign in"}</button>
				</form>
				<p className="seeded-access">Seeded access is documented in the project README.</p>
			</section>
		</main>
	);
}
