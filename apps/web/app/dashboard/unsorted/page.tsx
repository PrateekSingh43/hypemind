"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, FileText, Inbox } from "lucide-react";
import { api, resolveWorkspaceId } from "../../../lib/api";

type InboxItem = {
	id: string;
	title: string | null;
	type: string;
	updatedAt: string;
};

type InboxResponse = {
	success: boolean;
	data?: {
		items?: InboxItem[];
		nextCursor?: string | null;
	};
};

const WORKSPACE_REFRESH_EVENT = "hm:workspace-data/refresh";

function formatRelativeTime(dateISO: string) {
	const target = new Date(dateISO).getTime();
	if (Number.isNaN(target)) {
		return "recently";
	}

	const diffMs = target - Date.now();
	const absMs = Math.abs(diffMs);
	const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

	if (absMs < 60 * 1000) {
		return "just now";
	}
	if (absMs < 60 * 60 * 1000) {
		return formatter.format(Math.round(diffMs / (60 * 1000)), "minute");
	}
	if (absMs < 24 * 60 * 60 * 1000) {
		return formatter.format(Math.round(diffMs / (60 * 60 * 1000)), "hour");
	}
	return formatter.format(Math.round(diffMs / (24 * 60 * 60 * 1000)), "day");
}

export default function UnsortedPage() {
	const [items, setItems] = useState<InboxItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [processingItemIds, setProcessingItemIds] = useState<Record<string, boolean>>({});

	const loadInbox = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const workspaceId = await resolveWorkspaceId();
			if (!workspaceId) {
				setItems([]);
				setError("No active workspace is available for this session.");
				return;
			}

			const res = await api.get<InboxResponse>(`/workspaces/${workspaceId}/inbox?limit=50`);
			setItems(res.data?.items ?? []);
		} catch (fetchError) {
			setItems([]);
			setError(fetchError instanceof Error ? fetchError.message : "Failed to load inbox items.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void loadInbox();

		const onWorkspaceRefresh = () => {
			void loadInbox();
		};

		window.addEventListener(WORKSPACE_REFRESH_EVENT, onWorkspaceRefresh);
		return () => {
			window.removeEventListener(WORKSPACE_REFRESH_EVENT, onWorkspaceRefresh);
		};
	}, [loadInbox]);

	const processItem = useCallback(async (itemId: string) => {
		setProcessingItemIds((prev) => ({ ...prev, [itemId]: true }));
		setError(null);

		try {
			await api.patch<{ success: boolean }>(`/items/${itemId}/archive`, {});
			setItems((prev) => prev.filter((item) => item.id !== itemId));
			window.dispatchEvent(new Event(WORKSPACE_REFRESH_EVENT));
		} catch (processError) {
			setError(processError instanceof Error ? processError.message : "Failed to process item.");
		} finally {
			setProcessingItemIds((prev) => {
				const next = { ...prev };
				delete next[itemId];
				return next;
			});
		}
	}, []);

	return (
		<div className="mx-auto w-full max-w-4xl p-8 md:p-12">
			<div className="mb-8 flex items-start gap-3">
				<div className="mt-1 flex size-9 items-center justify-center rounded-lg bg-primary/10">
					<Inbox className="size-4 text-primary" />
				</div>
				<div>
					<h1 className="text-2xl font-semibold tracking-tight text-foreground">Unsorted</h1>
					<p className="text-sm text-muted-foreground">Captured items waiting to be organized into the PARA system.</p>
				</div>
			</div>

			{error && <p className="mb-4 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}

			{loading ? (
				<p className="text-sm text-muted-foreground">Loading unsorted items...</p>
			) : items.length === 0 ? (
				<p className="text-sm text-muted-foreground">No unsorted items right now.</p>
			) : (
				<div className="space-y-1">
					{items.map((item) => {
						const displayTitle = item.title?.trim() || `Untitled ${item.type.toLowerCase()}`;
						const isProcessing = processingItemIds[item.id] === true;

						return (
							<div key={item.id} className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-muted/50">
								<FileText className="size-4 text-muted-foreground transition-all duration-200 group-hover:scale-110 group-hover:text-primary" />
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium text-foreground">{displayTitle}</p>
									<p className="text-xs text-muted-foreground">Updated {formatRelativeTime(item.updatedAt)}</p>
								</div>
								<button
									type="button"
									disabled={isProcessing}
									onClick={() => {
										void processItem(item.id);
									}}
									className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
								>
									{isProcessing ? "Processing..." : "Process"}
									<ArrowRight className="size-3.5 transition-colors group-hover:text-primary" />
								</button>
								<button
									type="button"
									disabled={isProcessing}
									onClick={() => {
										void processItem(item.id);
									}}
									className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
									aria-label={`Mark ${displayTitle} as processed`}
								>
									<CheckCircle2 className="size-4 transition-colors group-hover:text-primary" />
								</button>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
