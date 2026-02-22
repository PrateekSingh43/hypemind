"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronsRight, Loader2, Send, Sparkles } from "lucide-react";
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
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

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
					? `You have ${inboxCount} unsorted item${inboxCount === 1 ? "" : "s"} waiting to be processed.`
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
						<ChevronsRight className="size-4 rotate-180" />
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
		<div className="flex h-full min-h-0 w-full flex-col border-l border-[#27282B] bg-[#151618]">
			{/* ── Smart Insight Card ──────────────────────────────────── */}
			<div className="shrink-0 px-3 pt-3 pb-2">
				<div className="rounded-lg bg-[#1E1F2E] p-3">
					<div className="mb-1.5 flex items-center justify-between">
						<div className="flex items-center gap-1.5">
							<Sparkles className="size-3.5 text-primary" />
							<span className="text-xs font-semibold text-[#EEEEEE]">Smart Insight</span>
						</div>
						<button
							type="button"
							onClick={onToggleCollapse}
							className="flex size-6 items-center justify-center rounded text-[#8A8F98] transition-colors hover:bg-[#26272B] hover:text-[#EEEEEE]"
							aria-label="Collapse sidebar"
							title="Collapse sidebar"
						>
							<ChevronsRight className="size-3.5" />
						</button>
					</div>
					<p className="text-[13px] leading-relaxed text-[#C4C4C4]">{smartInsight}</p>
					<button
						type="button"
						onClick={() => window.dispatchEvent(new Event("hm:quick-create/open"))}
						className="mt-2.5 inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
					>
						Create Canvas Draft <ArrowUpRight className="size-3" />
					</button>
				</div>
			</div>

			{/* ── Section Label ───────────────────────────────────────── */}
			<div className="shrink-0 px-4 pt-2 pb-2">
				<span className="text-[10px] font-semibold uppercase tracking-wider text-[#8A8F98]">
					AI Partner
				</span>
			</div>

			{/* ── Chat Messages ──────────────────────────────────────── */}
			<div className="flex min-h-0 flex-1 flex-col px-3">
				<div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto pb-2">
					{messages.map((message) => (
						<div
							key={message.id}
							className={
								message.role === "assistant"
									? "flex justify-start"
									: "flex justify-end"
							}
						>
							<div
								className={
									message.role === "assistant"
										? "max-w-[85%] rounded-lg rounded-tl-sm bg-[#2A2B30] px-3 py-2 text-[13px] leading-relaxed text-[#DDDDE0]"
										: "max-w-[85%] rounded-lg rounded-tr-sm bg-primary px-3 py-2 text-[13px] leading-relaxed text-primary-foreground"
								}
							>
								{message.content}
							</div>
						</div>
					))}

					{isSending && (
						<div className="flex justify-start">
							<div className="rounded-lg rounded-tl-sm bg-[#2A2B30] px-3 py-2">
								<Loader2 className="size-3.5 animate-spin text-[#8A8F98]" />
							</div>
						</div>
					)}

					<div ref={messagesEndRef} />
				</div>

				{chatError && <p className="shrink-0 py-1 text-[11px] text-destructive">{chatError}</p>}
			</div>

			{/* ── Input Area ─────────────────────────────────────────── */}
			<div className="shrink-0 border-t border-[#27282B] px-3 py-2.5">
				<div className="relative">
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
						className="w-full rounded-lg border border-[#2A2B30] bg-[#1A1B1E] py-2 pl-3 pr-10 text-[13px] text-[#EEEEEE] placeholder:text-[#5A5A65] transition-colors focus:border-primary/50 focus:outline-none"
					/>
					<button
						type="button"
						onClick={() => {
							void sendMessage();
						}}
						disabled={!input.trim() || isSending}
						className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
					>
						{isSending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
					</button>
				</div>
			</div>
		</div>
	);
}
