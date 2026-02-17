"use client";

import { Pin } from "lucide-react";

export default function PinnedPage() {
	return (
		<div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
			<div className="mb-8 flex items-center gap-3 border-b border-border pb-6">
				<div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
					<Pin className="size-5 text-primary" />
				</div>
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-foreground">Pinned Items</h1>
					<p className="text-sm text-muted-foreground">High-priority and frequently accessed entities.</p>
				</div>
			</div>
			<div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
				No pinned items found. Use the pin action on projects or documents to add them here.
			</div>
		</div>
	);
}