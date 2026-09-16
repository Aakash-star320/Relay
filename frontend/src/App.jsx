import { useCallback, useEffect, useState } from "react";
import { authApi } from "./features/auth/auth.api.js";
import { WorkspaceLogin } from "./features/auth/WorkspaceLogin.jsx";
import { BrandMark } from "./features/workspace/BrandMark.jsx";
import { RelayWorkspace } from "./features/workspace/RelayWorkspace.jsx";
import { hasSessionToken, setSessionToken } from "./shared/api/client.js";

function AppBootScreen() {
	return (
		<main className="app-boot" aria-label="Opening Relay" role="status">
			<div className="app-boot-brand">
				<BrandMark size="large" />
				<strong>Relay</strong>
			</div>
			<div className="app-boot-progress" aria-hidden="true">
				<span />
			</div>
		</main>
	);
}

export default function App() {
	const [account, setAccount] = useState(null);
	const [booting, setBooting] = useState(hasSessionToken());
	const [loginError, setLoginError] = useState("");
	const [loginPending, setLoginPending] = useState(false);

	const clearSession = useCallback(() => {
		setSessionToken("");
		setAccount(null);
	}, []);

	useEffect(() => {
		if (!hasSessionToken()) return;

		let active = true;
		authApi
			.session()
			.then(({ account: currentAccount }) => {
				if (active) setAccount(currentAccount);
			})
			.catch((error) => {
				if (active) {
					clearSession();
					setLoginError(error.message);
				}
			})
			.finally(() => {
				if (active) setBooting(false);
			});

		return () => {
			active = false;
		};
	}, [clearSession]);

	useEffect(() => {
		const handleExpiredSession = (event) => {
			clearSession();
			setBooting(false);
			setLoginError(event.detail || "Your Relay session has expired.");
		};

		window.addEventListener("relay-session-expired", handleExpiredSession);
		return () => window.removeEventListener("relay-session-expired", handleExpiredSession);
	}, [clearSession]);

	const handleLogin = async (email, password) => {
		try {
			setLoginPending(true);
			setLoginError("");
			const result = await authApi.login(email, password);
			setSessionToken(result.token);
			setAccount(result.account);
		} catch (error) {
			setLoginError(error.message);
		} finally {
			setLoginPending(false);
		}
	};

	const handleLogout = async () => {
		try {
			await authApi.logout();
		} catch {
			// Local session cleanup must still succeed if the API is unavailable.
		} finally {
			clearSession();
			setLoginError("");
		}
	};

	if (booting) return <AppBootScreen />;
	if (!account) return <WorkspaceLogin error={loginError} loading={loginPending} onLogin={handleLogin} />;

	return <RelayWorkspace account={account} onLogout={handleLogout} />;
}
