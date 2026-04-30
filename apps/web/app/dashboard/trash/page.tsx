"use client";

import { Trash2 } from "lucide-react";

export default function TrashPage() {
	return (
		<div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
			<div className="mb-8 flex items-center gap-3 border-b border-border pb-6">
				<div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted">
					<Trash2 className="size-5 text-muted-foreground" />
				</div>
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-foreground">Trash</h1>
					<p className="text-sm text-muted-foreground">Your deleted items live here for 30 days.</p>
				</div>
			</div>
			<div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">Trash is empty.</div>
		</div>
	);
}