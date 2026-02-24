"use client";

import * as React from "react";
import { GripVertical, Sparkles } from "lucide-react";
import { LeftSidebar } from "./left-sidebar";

import { RightSidebar } from "./right-sidebar";

// ── Storage keys ──────────────────────────────────────────────────────────────
const LEFT_WIDTH_KEY = "hm:dashboard:left-width:v2";
const RIGHT_WIDTH_KEY = "hm:dashboard:right-width:v2";
const LEFT_COLLAPSED_KEY = "hm:dashboard:left-collapsed:v2";
const RIGHT_COLLAPSED_KEY = "hm:dashboard:right-collapsed:v2";

// ── Constraints ───────────────────────────────────────────────────────────────
const LEFT_MIN = 180;
const LEFT_MAX = 280;
const LEFT_COLLAPSED_WIDTH = 60;
const LEFT_COLLAPSE_THRESHOLD = 120;

const RIGHT_MIN = 280;
const RIGHT_MAX = 597;
const RIGHT_COLLAPSE_THRESHOLD = 180;

const DEFAULT_LEFT_WIDTH = 240;
const DEFAULT_RIGHT_WIDTH = 320;

// ── Helpers ───────────────────────────────────────────────────────────────────
function readStorageNumber(key: string, fallback: number): number {
	try {
		const val = window.localStorage.getItem(key);
		if (val === null) return fallback;
		const num = Number(val);
		return Number.isFinite(num) ? num : fallback;
	} catch {
		return fallback;
	}
}

function readStorageBool(key: string, fallback: boolean): boolean {
	try {
		const val = window.localStorage.getItem(key);
		if (val === null) return fallback;
		return val === "1";
	} catch {
		return fallback;
	}
}

function writeStorage(key: string, value: string) {
	try {
		window.localStorage.setItem(key, value);
	} catch {
		// Ignore write failures.
	}
}

// ── Edge Drag Handle ──────────────────────────────────────────────────────────
// Absolutely positioned to overlap the sidebar's own border edge.
// The hover line replaces/highlights the sidebar border rather than creating a second line.
function EdgeDragHandle({
	side,
	onDragStart,
}: {
	side: "left" | "right";
	onDragStart: (e: React.MouseEvent) => void;
}) {
	const isLeft = side === "left";

	return (
		<div
			role="separator"
			aria-orientation="vertical"
			className="group/edge absolute top-0 bottom-0 z-20 flex cursor-col-resize items-center justify-center"
			style={{
				width: 12,
				// Overlap the sidebar border: for left sidebar, the border-right is at `right: 0`.
				// We center the 12px hit zone on that border.
				...(isLeft ? { right: -6 } : { left: -6 }),
			}}
			onMouseDown={onDragStart}
		>
			{/* 2px highlight line — sits exactly on the sidebar's border edge on hover */}
			<div
				className="absolute top-0 bottom-0 w-0.5 bg-transparent transition-colors duration-150 group-hover/edge:bg-border"
				style={{ left: 5 }}
			/>

			{/* Grip icon — fades in on hover, centered vertically */}
			<div className="z-10 flex h-7 w-4 items-center justify-center rounded-sm opacity-0 transition-opacity duration-150 group-hover/edge:opacity-100">
				<GripVertical className="h-5 w-5 text-muted-foreground/60" />
			</div>
		</div>
	);
}

// ── Main Component ────────────────────────────────────────────────────────────
type ResizableLayoutWrapperProps = {
	children: React.ReactNode;
	defaultLeftWidth?: number;
	defaultRightWidth?: number;
};

export function ResizableLayoutWrapper({
	children,
	defaultLeftWidth = DEFAULT_LEFT_WIDTH,
	defaultRightWidth = DEFAULT_RIGHT_WIDTH,
}: ResizableLayoutWrapperProps) {
	const [leftWidth, setLeftWidth] = React.useState(defaultLeftWidth);
	const [rightWidth, setRightWidth] = React.useState(defaultRightWidth);
	const [leftCollapsed, setLeftCollapsed] = React.useState(false);
	const [rightCollapsed, setRightCollapsed] = React.useState(true);
	const [mounted, setMounted] = React.useState(false);

	// Track dragging for cursor style on <body>
	const draggingRef = React.useRef<"left" | "right" | null>(null);
	// Track the pre-collapse width so we restore to it
	const savedRightWidthRef = React.useRef(defaultRightWidth);

	// ── Restore from localStorage on mount ──────────────────────────────────
	React.useEffect(() => {
		const storedLeft = readStorageNumber(LEFT_WIDTH_KEY, defaultLeftWidth);
		const storedRight = readStorageNumber(RIGHT_WIDTH_KEY, defaultRightWidth);
		const storedLeftCollapsed = readStorageBool(LEFT_COLLAPSED_KEY, false);
		const storedRightCollapsed = readStorageBool(RIGHT_COLLAPSED_KEY, true);

		setLeftWidth(storedLeftCollapsed ? LEFT_COLLAPSED_WIDTH : storedLeft);
		setRightWidth(storedRightCollapsed ? 0 : storedRight);
		setLeftCollapsed(storedLeftCollapsed);
		setRightCollapsed(storedRightCollapsed);
		savedRightWidthRef.current = storedRight;
		setMounted(true);
	}, [defaultLeftWidth, defaultRightWidth]);

	// ── Persist to localStorage ─────────────────────────────────────────────
	React.useEffect(() => {
		if (!mounted) return;
		writeStorage(LEFT_WIDTH_KEY, String(leftCollapsed ? DEFAULT_LEFT_WIDTH : leftWidth));
		writeStorage(LEFT_COLLAPSED_KEY, leftCollapsed ? "1" : "0");
	}, [leftWidth, leftCollapsed, mounted]);

	React.useEffect(() => {
		if (!mounted) return;
		writeStorage(RIGHT_WIDTH_KEY, String(rightCollapsed ? savedRightWidthRef.current : rightWidth));
		writeStorage(RIGHT_COLLAPSED_KEY, rightCollapsed ? "1" : "0");
	}, [rightWidth, rightCollapsed, mounted]);

	// ── Drag logic ──────────────────────────────────────────────────────────
	const startDrag = React.useCallback(
		(side: "left" | "right", e: React.MouseEvent) => {
			e.preventDefault();
			draggingRef.current = side;

			const startX = e.clientX;
			const startWidth = side === "left"
				? (leftCollapsed ? LEFT_COLLAPSED_WIDTH : leftWidth)
				: (rightCollapsed ? 0 : rightWidth);

			// Add cursor to body while dragging to prevent flicker
			document.body.style.cursor = "col-resize";
			document.body.style.userSelect = "none";

			const onMouseMove = (ev: MouseEvent) => {
				const delta = ev.clientX - startX;

				if (side === "left") {
					const newWidth = startWidth + delta;

					// Auto-collapse when dragged below threshold
					if (newWidth < LEFT_COLLAPSE_THRESHOLD) {
						setLeftWidth(LEFT_COLLAPSED_WIDTH);
						setLeftCollapsed(true);
						return;
					}

					// Clamp to valid range
					const clamped = Math.max(LEFT_MIN, Math.min(LEFT_MAX, newWidth));
					setLeftWidth(clamped);
					setLeftCollapsed(false);
				} else {
					// Right panel: dragging left = larger, dragging right = smaller
					const newWidth = startWidth - delta;

					// Auto-collapse
					if (newWidth < RIGHT_COLLAPSE_THRESHOLD) {
						setRightWidth(0);
						setRightCollapsed(true);
						return;
					}

					const clamped = Math.max(RIGHT_MIN, Math.min(RIGHT_MAX, newWidth));
					setRightWidth(clamped);
					setRightCollapsed(false);
					savedRightWidthRef.current = clamped;
				}
			};

			const onMouseUp = () => {
				draggingRef.current = null;
				document.body.style.cursor = "";
				document.body.style.userSelect = "";
				document.removeEventListener("mousemove", onMouseMove);
				document.removeEventListener("mouseup", onMouseUp);
			};

			document.addEventListener("mousemove", onMouseMove);
			document.addEventListener("mouseup", onMouseUp);
		},
		[leftWidth, rightWidth, leftCollapsed, rightCollapsed]
	);

	// ── Toggle callbacks ────────────────────────────────────────────────────
	const toggleLeftSidebar = React.useCallback(() => {
		if (leftCollapsed) {
			const restored = readStorageNumber(LEFT_WIDTH_KEY, DEFAULT_LEFT_WIDTH);
			setLeftWidth(Math.max(LEFT_MIN, Math.min(LEFT_MAX, restored)));
			setLeftCollapsed(false);
		} else {
			setLeftWidth(LEFT_COLLAPSED_WIDTH);
			setLeftCollapsed(true);
		}
	}, [leftCollapsed]);

	const toggleRightSidebar = React.useCallback(() => {
		if (rightCollapsed) {
			const restored = savedRightWidthRef.current || DEFAULT_RIGHT_WIDTH;
			setRightWidth(Math.max(RIGHT_MIN, Math.min(RIGHT_MAX, restored)));
			setRightCollapsed(false);
		} else {
			savedRightWidthRef.current = rightWidth;
			setRightWidth(0);
			setRightCollapsed(true);
		}
	}, [rightCollapsed, rightWidth]);

	const openRightSidebar = React.useCallback(() => {
		const restored = savedRightWidthRef.current || DEFAULT_RIGHT_WIDTH;
		setRightWidth(Math.max(RIGHT_MIN, Math.min(RIGHT_MAX, restored)));
		setRightCollapsed(false);
	}, []);

	// Listen for custom event from child pages (e.g., unsorted page AI button)
	React.useEffect(() => {
		const handler = () => openRightSidebar();
		window.addEventListener("hm:open-right-sidebar", handler);
		return () => window.removeEventListener("hm:open-right-sidebar", handler);
	}, [openRightSidebar]);

	// ── Computed widths ─────────────────────────────────────────────────────
	const effectiveLeftWidth = leftCollapsed ? LEFT_COLLAPSED_WIDTH : leftWidth;
	const effectiveRightWidth = rightCollapsed ? 0 : rightWidth;

	return (
		<div className="flex h-screen w-full overflow-hidden bg-background">
			{/* Desktop layout */}
			<div className="relative hidden h-full w-full md:flex">
				{/* Left sidebar — relative so the edge handle can be positioned */}
				<div
					className="relative h-full shrink-0 overflow-visible transition-[width] duration-200 ease-out"
					style={{
						width: effectiveLeftWidth,
						transitionDuration: draggingRef.current === "left" ? "0ms" : undefined,
					}}
				>
					<div className="h-full overflow-hidden">
						<LeftSidebar
							isCollapsed={leftCollapsed}
							onToggleCollapse={toggleLeftSidebar}
						/>
					</div>
					{/* Drag handle on the right edge of the left sidebar */}
					<EdgeDragHandle
						side="left"
						onDragStart={(e) => startDrag("left", e)}
					/>
				</div>

				{/* Main content */}
				<main className="scrollbar-thin h-full min-w-0 flex-1 overflow-hidden bg-background">
					{children}
				</main>

				{/* Right sidebar — relative so the edge handle can be positioned */}
				{!rightCollapsed && (
					<div
						className="relative h-full shrink-0 overflow-visible transition-[width] duration-200 ease-out"
						style={{
							width: effectiveRightWidth,
							transitionDuration: draggingRef.current === "right" ? "0ms" : undefined,
						}}
					>
						{/* Drag handle on the left edge of the right sidebar */}
						<EdgeDragHandle
							side="right"
							onDragStart={(e) => startDrag("right", e)}
						/>
						<div className="h-full overflow-hidden">
							<RightSidebar
								isCollapsed={false}
								onToggleCollapse={toggleRightSidebar}
							/>
						</div>
					</div>
				)}

				{/* AI Assistant — subtle FAB (Notion-style), shown when right sidebar is collapsed */}
				{rightCollapsed && (
					<button
						type="button"
						onClick={openRightSidebar}
						className="fixed bottom-5 right-5 z-50 flex size-13 items-center justify-center rounded-full border border-[#27282B] bg-[#1C1D21] text-[#8A8F98] shadow-md transition-all hover:border-[#5E6AD2]/50 hover:text-[#EEEEEE] hover:shadow-[0_0_24px_rgba(94,106,210,0.35)] active:scale-95"
						aria-label="Open AI Assistant"
						title="AI Assistant"
					>
						<Sparkles className="size-5" />
					</button>
				)}
			</div>

			{/* Mobile layout */}
			<div className="scrollbar-thin h-full overflow-y-auto md:hidden">
				<main className="mx-auto min-h-full w-full max-w-4xl px-4 py-6">
					{children}
				</main>
			</div>


		</div>
	);
}
