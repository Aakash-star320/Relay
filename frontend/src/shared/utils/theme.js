const STORAGE_KEY = "relay-theme";
const THEMES = ["dark", "light"];
const DEFAULT_THEME = "dark";

export function readTheme() {
	const storedTheme = localStorage.getItem(STORAGE_KEY);
	return THEMES.includes(storedTheme) ? storedTheme : DEFAULT_THEME;
}

export function applyTheme(theme) {
	const nextTheme = THEMES.includes(theme) ? theme : DEFAULT_THEME;
	document.documentElement.dataset.theme = nextTheme;
	localStorage.setItem(STORAGE_KEY, nextTheme);
	return nextTheme;
}
