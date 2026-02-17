"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Bell, Laptop, Moon, Settings, Sun, User } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

const THEME_OPTIONS = [
	{ id: "light", label: "Light", icon: Sun },
	{ id: "dark", label: "Dark", icon: Moon },
	{ id: "system", label: "System", icon: Laptop },
] as const;

export default function SettingsPage() {
	const { theme, resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const currentModeLabel = mounted ? (resolvedTheme === "dark" ? "Dark" : "Light") : "Loading";

	return (
		<div className="mx-auto w-full max-w-4xl p-8 md:p-12">
			<div className="mb-10 flex items-center gap-3">
				<div className="flex size-10 items-center justify-center rounded-lg bg-muted">
					<Settings className="size-5 text-foreground" />
				</div>
				<div>
					<h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
					<p className="text-sm text-muted-foreground">Manage preferences and workspace behavior.</p>
				</div>
			</div>

			<div className="space-y-5">
				<section className="group rounded-2xl bg-card p-6 ring-1 ring-border/80 transition-colors hover:bg-muted/20">
					<div className="mb-5 flex items-start justify-between gap-3">
						<div>
							<h2 className="text-base font-semibold text-foreground">Appearance</h2>
							<p className="text-sm text-muted-foreground">Theme mode and quick visual preferences.</p>
						</div>
						<button
							type="button"
							onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
							className="inline-flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/80"
						>
							{resolvedTheme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
							Toggle Theme
						</button>
					</div>

					<div className="grid gap-3 sm:grid-cols-3">
						{THEME_OPTIONS.map((option) => {
							const active = mounted && theme === option.id;
							return (
								<button
									key={option.id}
									type="button"
									onClick={() => setTheme(option.id)}
									className={cn(
										"flex items-center gap-2 rounded-xl px-4 py-3 text-sm transition-colors",
										active ? "bg-primary text-primary-foreground" : "bg-muted/60 text-foreground hover:bg-muted"
									)}
								>
									<option.icon className="size-4" />
									<span>{option.label}</span>
								</button>
							);
						})}
					</div>

					<div className="mt-4 rounded-xl bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
						Active mode: <span className="font-semibold text-foreground">{currentModeLabel}</span>
					</div>
				</section>

				<section className="group rounded-2xl bg-card p-6 ring-1 ring-border/80 transition-colors hover:bg-muted/20">
					<div className="mb-4 flex items-center gap-3">
						<Settings className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
						<h2 className="text-base font-semibold text-foreground">Shortcut Keys</h2>
					</div>
					<div className="space-y-2 text-sm">
						<div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
							<span className="text-muted-foreground">Quick Create Modal</span>
							<kbd className="rounded-md bg-background px-2 py-1 text-xs font-semibold text-foreground ring-1 ring-border">Cmd/Ctrl + N</kbd>
						</div>
						<div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
							<span className="text-muted-foreground">Toggle Theme</span>
							<kbd className="rounded-md bg-background px-2 py-1 text-xs font-semibold text-foreground ring-1 ring-border">Cmd/Ctrl + Shift + L</kbd>
						</div>
					</div>
				</section>

				<section className="group rounded-2xl bg-card p-6 ring-1 ring-border/80 transition-colors hover:bg-muted/20">
					<div className="mb-4 flex items-center gap-3">
						<User className="size-5 text-primary transition-transform duration-200 group-hover:scale-110" />
						<h2 className="text-base font-semibold text-foreground">Profile</h2>
					</div>
					<div className="space-y-4">
						<div>
							<label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</label>
							<input type="text" defaultValue="Prateek" className="w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
						</div>
						<div>
							<label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Address</label>
							<input type="email" defaultValue="prateek@example.com" disabled className="w-full cursor-not-allowed rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground outline-none" />
						</div>
					</div>
				</section>

				<section className="group rounded-2xl bg-card p-6 ring-1 ring-border/80 transition-colors hover:bg-muted/20">
					<div className="mb-4 flex items-center gap-3">
						<Bell className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
						<h2 className="text-base font-semibold text-foreground">Notifications</h2>
					</div>
					<p className="text-sm text-muted-foreground">Notification routing is currently in preview for this workspace tier.</p>
				</section>
			</div>
		</div>
	);
}
