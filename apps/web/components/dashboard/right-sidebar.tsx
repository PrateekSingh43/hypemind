"use client";

import { useState } from "react";
import { FileText, ListTodo, Search, Send, Sparkles, User, WandSparkles } from "lucide-react";

const QUICK_ACTIONS = [
	{ id: "summarize", label: "Summarize", icon: FileText },
	{ id: "extract", label: "Extract Tasks", icon: ListTodo },
	{ id: "outline", label: "Draft Outline", icon: WandSparkles },
	{ id: "context", label: "Find Context", icon: Search },
];

export function RightSidebar() {
	const [input, setInput] = useState("");

	return (
		<div className="flex h-full min-h-0 w-full flex-col border-l border-border bg-card">
			<div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
				<div className="flex items-center gap-2">
					<Sparkles className="size-4 text-primary" />
					<span className="text-sm font-semibold text-foreground">AI Assistant</span>
				</div>
				<div className="flex size-7 items-center justify-center rounded-full bg-primary/10">
					<User className="size-3.5 text-primary" />
				</div>
			</div>

			<div className="border-b border-border p-3">
				<h4 className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Quick Actions</h4>
				<div className="grid grid-cols-2 gap-1.5">
					{QUICK_ACTIONS.map((action) => (
						<button key={action.id} type="button" className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1.5 text-left transition-colors hover:border-primary/50 hover:bg-primary/5">
							<action.icon className="size-3.5 text-muted-foreground" />
							<span className="truncate text-xs font-medium text-foreground">{action.label}</span>
						</button>
					))}
				</div>
			</div>

			<div className="flex flex-1 min-h-0 flex-col items-center justify-center overflow-y-auto p-6 text-center">
				<div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
					<Sparkles className="size-6 text-primary" />
				</div>
				<h3 className="mb-1 text-sm font-semibold text-foreground">Ask me anything</h3>
				<p className="mb-4 max-w-[220px] text-xs text-muted-foreground">I can summarize notes, pull action items, and suggest next steps from your workspace context.</p>
			</div>

			<div className="shrink-0 border-t border-border bg-card p-3">
				<div className="relative">
					<input
						type="text"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder="Ask the assistant..."
						className="w-full rounded-md border border-input bg-input-background py-2.5 pl-3 pr-10 text-sm shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
					/>
					<button
						type="button"
						disabled={!input.trim()}
						className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-sm bg-primary/10 text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
					>
						<Send className="size-3.5" />
					</button>
				</div>
			</div>
		</div>
	);
}