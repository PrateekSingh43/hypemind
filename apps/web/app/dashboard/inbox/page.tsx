"use client";

import { CheckCircle2, FileText, Inbox } from "lucide-react";

const INBOX_ITEMS = [
	{ id: "1", title: "Review PR #412", context: "HypeMind Core", time: "10m ago" },
	{ id: "2", title: "Design Systems sync notes", context: "Design", time: "1h ago" },
	{ id: "3", title: "API Documentation Draft", context: "Product Development", time: "3h ago" },
];

export default function InboxPage() {
	return (
		<div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
			<div className="mb-8 flex items-center gap-3 border-b border-border pb-6">
				<div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
					<Inbox className="size-5 text-primary" />
				</div>
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-foreground">Inbox</h1>
					<p className="text-sm text-muted-foreground">Capture and process incoming items.</p>
				</div>
			</div>

			<div className="space-y-2">
				{INBOX_ITEMS.map((item) => (
					<div key={item.id} className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-center gap-4">
							<FileText className="size-5 text-muted-foreground" />
							<div>
								<p className="text-sm font-medium text-foreground">{item.title}</p>
								<p className="mt-0.5 text-xs text-muted-foreground">{item.context}</p>
							</div>
						</div>
						<div className="flex items-center justify-between gap-4 sm:justify-end">
							<span className="text-xs text-muted-foreground">{item.time}</span>
							<button type="button" className="flex size-8 items-center justify-center rounded-md text-muted-foreground opacity-100 transition-colors hover:bg-primary/10 hover:text-primary sm:opacity-0 sm:group-hover:opacity-100">
								<CheckCircle2 className="size-[18px]" />
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}