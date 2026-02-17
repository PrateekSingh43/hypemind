"use client";

import { Bell, Settings, User } from "lucide-react";

export default function SettingsPage() {
	return (
		<div className="mx-auto w-full max-w-4xl p-4 sm:p-6 lg:p-8">
			<div className="mb-8 flex items-center gap-3 border-b border-border pb-6">
				<div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted">
					<Settings className="size-5 text-foreground" />
				</div>
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
					<p className="text-sm text-muted-foreground">Configuration for workspace and user preferences.</p>
				</div>
			</div>

			<div className="grid gap-6">
				<div className="rounded-xl border border-border bg-card p-6 shadow-sm">
					<div className="mb-4 flex items-center gap-3">
						<User className="size-5 text-primary" />
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
				</div>

				<div className="pointer-events-none rounded-xl border border-border bg-card p-6 opacity-50 shadow-sm">
					<div className="mb-4 flex items-center gap-3">
						<Bell className="size-5 text-muted-foreground" />
						<h2 className="text-base font-semibold text-foreground">Notifications</h2>
					</div>
					<p className="text-sm text-muted-foreground">Notification routing configuration unavailable in current implementation tier.</p>
				</div>
			</div>
		</div>
	);
}