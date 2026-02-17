"use client";

import { useEffect, useState } from "react";
import { FileText, FolderOpen, Upload, X } from "lucide-react";

const CREATE_OPTIONS = [
	{ id: "note", label: "Quick Note", description: "Create a new text entry", icon: FileText },
	{ id: "canvas", label: "New Canvas", description: "Start a blank spatial board", icon: FolderOpen },
	{ id: "upload", label: "Upload File", description: "Import document or image", icon: Upload },
];

export function QuickCreateModal() {
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") {
				event.preventDefault();
				setIsOpen(true);
			}
			if (event.key === "Escape") {
				setIsOpen(false);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	if (!isOpen) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
			<div className="w-full max-w-md rounded-xl border border-border bg-card shadow-2xl" onClick={(event) => event.stopPropagation()}>
				<div className="flex items-center justify-between border-b border-border p-4">
					<h2 className="text-sm font-semibold text-foreground">Quick Create</h2>
					<button type="button" onClick={() => setIsOpen(false)} className="flex size-7 items-center justify-center rounded-md transition-colors hover:bg-muted">
						<X className="size-4 text-muted-foreground" />
					</button>
				</div>
				<div className="space-y-1 p-3">
					{CREATE_OPTIONS.map((option) => (
						<button key={option.id} type="button" onClick={() => setIsOpen(false)} className="group flex w-full items-center gap-3 rounded-lg border border-transparent p-3 text-left transition-colors hover:bg-muted">
							<div className="flex size-10 items-center justify-center rounded-md bg-muted transition-colors group-hover:bg-primary/10">
								<option.icon className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
							</div>
							<div>
								<div className="text-sm font-medium text-foreground">{option.label}</div>
								<div className="text-xs text-muted-foreground">{option.description}</div>
							</div>
						</button>
					))}
				</div>
				<div className="rounded-b-xl border-t border-border bg-muted/30 p-3 text-center">
					<p className="text-[11px] text-muted-foreground">
						Press <span className="font-semibold text-foreground">Ctrl + N</span> to quick capture
					</p>
				</div>
			</div>
		</div>
	);
}