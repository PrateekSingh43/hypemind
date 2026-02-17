"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "next-themes";

function ThemeHotkeys() {
	const { resolvedTheme, setTheme } = useTheme();

	React.useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "l") {
				event.preventDefault();
				setTheme(resolvedTheme === "dark" ? "light" : "dark");
			}
		};

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [resolvedTheme, setTheme]);

	return null;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
	const [queryClient] = React.useState(() => new QueryClient());

	return (
		<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
			<QueryClientProvider client={queryClient}>
				<ThemeHotkeys />
				{children}
			</QueryClientProvider>
		</ThemeProvider>
	);
}
