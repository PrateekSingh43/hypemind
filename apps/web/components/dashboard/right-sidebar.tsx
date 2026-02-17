"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, ChevronsLeft, ChevronsRight, Loader2, Send, Sparkles } from "lucide-react";
import { api, resolveWorkspaceId } from "../../lib/api";

type ChatMessage = {
	id: string;
	role: "assistant" | "user";
	content: string;
};

type BootstrapResponse = {
	success: boolean;
	data?: {
		inboxCount?: number;
		recentItems?: Array<{
			id: string;
			title: string | null;
		}>;
	};
};

type AiChatResponse = {
	success: boolean;
	data?: {
		reply?: string;
	};
};

type RightSidebarProps = {
	isCollapsed?: boolean;
	onToggleCollapse?: () => void;
};

function createMessageId() {
	return `m-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function RightSidebar({ isCollapsed = false, onToggleCollapse }: RightSidebarProps) {
	const [input, setInput] = useState("");
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [isSending, setIsSending] = useState(false);
	const [chatError, setChatError] = useState<string | null>(null);
	const [smartInsight, setSmartInsight] = useState("Syncing workspace context...");

	const initializeContext = useCallback(async () => {
		try {
			const workspaceId = await resolveWorkspaceId();
			if (!workspaceId) {
				setSmartInsight("Sign in to connect workspace context.");
				setMessages([
					{
						id: createMessageId(),
						role: "assistant",
						content: "I can help with workspace reasoning once your account and workspace are connected.",
					},
				]);
				return;
			}

			const bootstrap = await api.get<BootstrapResponse>(`/workspaces/${workspaceId}/bootstrap`);
			const inboxCount = bootstrap.data?.inboxCount ?? 0;
			const latestTitle = bootstrap.data?.recentItems?.find((item) => item.title?.trim())?.title ?? null;

			setSmartInsight(
				inboxCount > 0
					? `You currently have ${inboxCount} unsorted item${inboxCount === 1 ? "" : "s"} waiting to be processed.`
					: "Your unsorted inbox is clear right now."
			);

			setMessages([
				{
					id: createMessageId(),
					role: "assistant",
					content: latestTitle
						? `Workspace context loaded. Recent activity includes "${latestTitle}".`
						: "Workspace context loaded. Ask me to organize, summarize, or draft from your notes.",
				},
			]);
		} catch {
			setSmartInsight("Workspace insight is temporarily unavailable.");
			setMessages([
				{
					id: createMessageId(),
					role: "assistant",
					content: "I can still receive prompts, but context loading failed for this session.",
				},
			]);
		}
	}, []);

	useEffect(() => {
		void initializeContext();
	}, [initializeContext]);

	const sendMessage = useCallback(async () => {
		const value = input.trim();
		if (!value || isSending) {
			return;
		}

		const userMessage: ChatMessage = { id: createMessageId(), role: "user", content: value };
		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setChatError(null);
		setIsSending(true);

		try {
			const workspaceId = await resolveWorkspaceId();
			if (!workspaceId) {
				throw new Error("No active workspace found for AI chat.");
			}

			const res = await api.post<AiChatResponse>("/ai/chat", {
				message: value,
				workspaceId,
			});

			const reply = res.data?.reply ?? "Context received.";
			setMessages((prev) => [...prev, { id: createMessageId(), role: "assistant", content: reply }]);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Failed to send message.";
			setChatError(message);
			setMessages((prev) => [
				...prev,
				{
					id: createMessageId(),
					role: "assistant",
					content: `I couldn't send that yet: ${message}`,
				},
			]);
		} finally {
			setIsSending(false);
		}
	}, [input, isSending]);

	if (isCollapsed) {
		return (
			<div className="flex h-full min-h-0 w-full flex-col border-l border-border/80 bg-card px-2 py-3">
				<div className="mb-3 flex justify-end">
					<button
						type="button"
						onClick={onToggleCollapse}
						className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
						aria-label="Expand right sidebar"
						title="Expand sidebar"
					>
						<ChevronsLeft className="size-4" />
					</button>
				</div>
				<div className="flex flex-1 items-center justify-center">
					<div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
						<Sparkles className="size-5 text-primary" />
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full min-h-0 w-full flex-col border-l border-border/80 bg-card px-3 py-3">
			<div className="mb-3 flex h-11 shrink-0 items-center justify-between border-b border-border px-1 pb-2">
				<h3 className="text-sm font-semibold text-foreground">AI Partner</h3>
				<button
					type="button"
					onClick={onToggleCollapse}
					className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
					aria-label="Collapse right sidebar"
					title="Collapse sidebar"
				>
					<ChevronsRight className="size-4" />
				</button>
			</div>

			<div className="mb-3 rounded-lg bg-primary/10 p-4">
				<div className="mb-2 flex items-center gap-2">
					<Sparkles className="size-4 text-primary" />
					<h4 className="text-sm font-semibold text-foreground">Smart Insight</h4>
				</div>
				<p className="text-sm leading-relaxed text-foreground">{smartInsight}</p>
				<button
					type="button"
					onClick={() => window.dispatchEvent(new Event("hm:quick-create/open"))}
					className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
				>
					Create Canvas Draft <ArrowUpRight className="size-3.5" />
				</button>
			</div>

			<div className="flex min-h-0 flex-1 flex-col">
				<div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto pr-1">
					{messages.map((message) => (
						<div
							key={message.id}
							className={
								message.role === "assistant"
									? "mr-4 rounded-md bg-muted px-3 py-2 text-sm text-foreground"
									: "ml-4 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
							}
						>
							{message.content}
						</div>
					))}
				</div>

				{chatError && <p className="mt-2 text-xs text-destructive">{chatError}</p>}

				<div className="relative mt-3 border-t border-border bg-background pt-3">
					<input
						type="text"
						value={input}
						onChange={(event) => setInput(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								event.preventDefault();
								void sendMessage();
							}
						}}
						placeholder="Talk to your AI partner..."
						className="w-full rounded-md border border-input bg-muted/40 py-2.5 pl-3 pr-10 text-sm transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
					/>
					<button
						type="button"
						onClick={() => {
							void sendMessage();
						}}
						disabled={!input.trim() || isSending}
						className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isSending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
					</button>
				</div>
			</div>
		</div>
	);
}
