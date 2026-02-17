"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, Layout, Loader2, Upload, X } from "lucide-react";
import { api, resolveWorkspaceId } from "../../lib/api";

const PRIMARY_OPTIONS = [
	{
		id: "canvas",
		type: "PAGE",
		itemTypeBadge: "ItemType.PAGE",
		title: "Untitled Canvas",
		label: "Canvas",
		description: "A spatial block editor for deep thinking",
		icon: Layout,
	},
	{
		id: "quick-note",
		type: "QUICK_NOTE",
		itemTypeBadge: "ItemType.QUICK_NOTE",
		title: "Untitled Quick Note",
		label: "Quick Note",
		description: "Fast, unformatted text capture",
		icon: FileText,
	},
] as const;

const WORKSPACE_REFRESH_EVENT = "hm:workspace-data/refresh";

export function QuickCreateModal() {
	const [isOpen, setIsOpen] = useState(false);
	const [submittingOptionId, setSubmittingOptionId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") {
				event.preventDefault();
				setError(null);
				setIsOpen(true);
			}
			if (event.key === "Escape") {
				setIsOpen(false);
			}
		};
		const handleGlobalOpen = () => {
			setError(null);
			setIsOpen(true);
		};

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("hm:quick-create/open", handleGlobalOpen);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("hm:quick-create/open", handleGlobalOpen);
		};
	}, []);

	const createItem = useCallback(
		async (payload: { id: string; type: string; title: string }) => {
			setSubmittingOptionId(payload.id);
			setError(null);

			try {
				const workspaceId = await resolveWorkspaceId();
				if (!workspaceId) {
					throw new Error("No active workspace found.");
				}

				await api.post<{ success: boolean }>(`/workspaces/${workspaceId}/items`, {
					type: payload.type,
					title: payload.title,
					contentJson: { blocks: [] },
				});

				window.dispatchEvent(new Event(WORKSPACE_REFRESH_EVENT));
				setIsOpen(false);
			} catch (createError) {
				setError(createError instanceof Error ? createError.message : "Failed to create item.");
			} finally {
				setSubmittingOptionId(null);
			}
		},
		[]
	);

	if (!isOpen) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-100 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
			<div className="w-full max-w-lg rounded-2xl bg-card p-5 shadow-2xl ring-1 ring-border/70" onClick={(event) => event.stopPropagation()}>
				<div className="flex items-center justify-between border-b border-border p-4">
					<div>
						<h2 className="text-sm font-semibold text-foreground">Quick Create</h2>
						<p className="text-xs text-muted-foreground">Global capture for your second brain.</p>
					</div>
					<button type="button" onClick={() => setIsOpen(false)} className="flex size-7 items-center justify-center rounded-md transition-colors hover:bg-muted">
						<X className="size-4 text-muted-foreground" />
					</button>
				</div>

				{error && <p className="mt-3 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</p>}

				<div className="space-y-2 pt-4">
					{PRIMARY_OPTIONS.map((option) => {
						const isSubmitting = submittingOptionId === option.id;

						return (
							<button
								key={option.id}
								type="button"
								disabled={submittingOptionId !== null}
								onClick={() => {
									void createItem({ id: option.id, type: option.type, title: option.title });
								}}
								className="group flex w-full items-start gap-3 rounded-xl bg-muted/40 p-4 text-left transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
							>
								<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background transition-colors group-hover:bg-primary/10">
									{isSubmitting ? (
										<Loader2 className="size-5 animate-spin text-muted-foreground" />
									) : (
										<option.icon className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
									)}
								</div>
								<div className="min-w-0">
									<div className="mb-0.5 flex items-center gap-2">
										<span className="text-base font-semibold text-foreground">{option.label}</span>
										<span className="rounded bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{option.itemTypeBadge}</span>
									</div>
									<div className="text-sm text-muted-foreground">{option.description}</div>
								</div>
							</button>
						);
					})}
				</div>

				<div className="mt-4 rounded-xl bg-muted/40 p-3">
					<button
						type="button"
						disabled={submittingOptionId !== null}
						onClick={() => {
							void createItem({ id: "file-upload", type: "FILE", title: "Uploaded File" });
						}}
						className="group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-60"
					>
						<div className="flex size-8 items-center justify-center rounded-md bg-background">
							{submittingOptionId === "file-upload" ? (
								<Loader2 className="size-4 animate-spin text-muted-foreground" />
							) : (
								<Upload className="size-4 text-muted-foreground" />
							)}
						</div>
						<div className="min-w-0">
							<div className="flex items-center gap-2">
								<span className="text-sm font-medium text-foreground">Upload File</span>
								<span className="rounded bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">ItemType.FILE</span>
							</div>
							<p className="text-xs text-muted-foreground">Create a file placeholder in your workspace.</p>
						</div>
					</button>
				</div>
			</div>
		</div>
	);
}
