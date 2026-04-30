"use client";

import * as React from "react";
import { GripVertical, Sparkles } from "lucide-react";
import { LeftSidebar } from "./left-sidebar";
import { RightSidebar } from "./right-sidebar";

const LEFT_WIDTH_KEY = "hm:dashboard:left-width:v2";
const RIGHT_WIDTH_KEY = "hm:dashboard:right-width:v2";
const LEFT_COLLAPSED_KEY = "hm:dashboard:left-collapsed:v2";
const RIGHT_COLLAPSED_KEY = "hm:dashboard:right-collapsed:v2";

const LEFT_MIN = 180;
const LEFT_MAX = 280;
const LEFT_COLLAPSED_WIDTH = 60;
const LEFT_COLLAPSE_THRESHOLD = 120;

const RIGHT_MIN = 280;
const RIGHT_MAX = 597;
const RIGHT_COLLAPSE_THRESHOLD = 180;

const DEFAULT_LEFT_WIDTH = 240;
const DEFAULT_RIGHT_WIDTH = 320;

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
	}
}

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
				...(isLeft ? { right: -6 } : { left: -6 }),
			}}
			onMouseDown={onDragStart}
		>
			<div
				className="absolute top-0 bottom-0 w-0.5 bg-transparent transition-colors duration-150 group-hover/edge:bg-border"
				style={{ left: 5 }}
			/>
			<div className="z-10 flex h-7 w-4 items-center justify-center rounded-sm opacity-0 transition-opacity duration-150 group-hover/edge:opacity-100">
				<GripVertical className="h-5 w-5 text-muted-foreground/60" />
			</div>
		</div>
	);
}

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

	const draggingRef = React.useRef<"left" | "right" | null>(null);
	const savedRightWidthRef = React.useRef(defaultRightWidth);

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

	const startDrag = React.useCallback(
		(side: "left" | "right", e: React.MouseEvent) => {
			e.preventDefault();
			draggingRef.current = side;

			const startX = e.clientX;
			const startWidth = side === "left"
				? (leftCollapsed ? LEFT_COLLAPSED_WIDTH : leftWidth)
				: (rightCollapsed ? 0 : rightWidth);

			document.body.style.cursor = "col-resize";
			document.body.style.userSelect = "none";

			const onMouseMove = (ev: MouseEvent) => {
				const delta = ev.clientX - startX;

				if (side === "left") {
					const newWidth = startWidth + delta;

					if (newWidth < LEFT_COLLAPSE_THRESHOLD) {
						setLeftWidth(LEFT_COLLAPSED_WIDTH);
						setLeftCollapsed(true);
						return;
					}

					const clamped = Math.max(LEFT_MIN, Math.min(LEFT_MAX, newWidth));
					setLeftWidth(clamped);
					setLeftCollapsed(false);
				} else {
					const newWidth = startWidth - delta;

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

	React.useEffect(() => {
		const handler = () => openRightSidebar();
		window.addEventListener("hm:open-right-sidebar", handler);
		return () => window.removeEventListener("hm:open-right-sidebar", handler);
	}, [openRightSidebar]);

	const effectiveLeftWidth = leftCollapsed ? LEFT_COLLAPSED_WIDTH : leftWidth;
	const effectiveRightWidth = rightCollapsed ? 0 : rightWidth;

	return (
		<div className="flex h-screen w-full overflow-hidden bg-background">
			<div className="relative hidden h-full w-full md:flex">
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
					<EdgeDragHandle
						side="left"
						onDragStart={(e) => startDrag("left", e)}
					/>
				</div>

				<main className="scrollbar-thin h-full min-w-0 flex-1 overflow-hidden bg-background">
					{children}
				</main>

				{!rightCollapsed && (
					<div
						className="relative h-full shrink-0 overflow-visible transition-[width] duration-200 ease-out"
						style={{
							width: effectiveRightWidth,
							transitionDuration: draggingRef.current === "right" ? "0ms" : undefined,
						}}
					>
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

				{rightCollapsed && (
					<button
						type="button"
						onClick={openRightSidebar}
						className="fixed bottom-5 right-5 z-50 flex size-13 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground shadow-md transition-all hover:border-primary/50 hover:text-foreground hover:shadow-[0_0_24px_rgba(94,106,210,0.35)] active:scale-95"
						aria-label="Open AI Assistant"
						title="AI Assistant"
					>
						<Sparkles className="size-5" />
					</button>
				)}
			</div>

			<div className="scrollbar-thin h-full overflow-y-auto md:hidden">
				<main className="mx-auto min-h-full w-full max-w-4xl px-4 py-6">
					{children}
				</main>
			</div>
		</div>
	);
}