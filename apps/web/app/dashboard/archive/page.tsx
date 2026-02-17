"use client";

import { Archive } from "lucide-react";

export default function ArchivePage() {
	return (
		<div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
			<div className="mb-8 flex items-center gap-3 border-b border-border pb-6">
				<div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted">
					<Archive className="size-5 text-muted-foreground" />
				</div>
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-foreground">Archive</h1>
					<p className="text-sm text-muted-foreground">Cold storage for completed or deprecated entities.</p>
				</div>
			</div>
			<div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">Archive is empty.</div>
		</div>
	);
}