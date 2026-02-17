"use client";

import { Book, Calendar } from "lucide-react";

export default function JournalPage() {
	return (
		<div className="mx-auto flex h-full w-full max-w-5xl flex-col p-4 sm:p-6 lg:p-8">
			<div className="mb-8 flex shrink-0 items-center justify-between gap-3 border-b border-border pb-6">
				<div className="flex items-center gap-3">
					<div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
						<Book className="size-5 text-primary" />
					</div>
					<div>
						<h1 className="text-2xl font-bold tracking-tight text-foreground">Journal</h1>
						<p className="text-sm text-muted-foreground">Daily logs and continuous documentation.</p>
					</div>
				</div>
				<button type="button" className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted">
					<Calendar className="size-4 text-muted-foreground" />
					Today
				</button>
			</div>

			<div className="flex-1 rounded-xl border border-border bg-card p-6 shadow-sm">
				<textarea
					placeholder="Start typing your entry for today..."
					className="h-full w-full resize-none bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/60"
				/>
			</div>
		</div>
	);
}