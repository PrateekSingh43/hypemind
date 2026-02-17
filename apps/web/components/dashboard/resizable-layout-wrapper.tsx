"use client";

import * as React from "react";
import { ChevronsLeft } from "lucide-react";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@repo/ui/components/resizable";
import { LeftSidebar } from "./left-sidebar";
import { QuickCreateModal } from "./quick-create-modal";
import { RightSidebar } from "./right-sidebar";

const PANEL_LAYOUT_COOKIE = "react-resizable-panels-layout";
const LEGACY_PANEL_LAYOUT_COOKIE = "react-resizable-panels:layout";
const LEFT_COLLAPSED_KEY = "hm:dashboard:left-collapsed:v1";
const RIGHT_COLLAPSED_KEY = "hm:dashboard:right-collapsed:v1";
const LEFT_COLLAPSE_THRESHOLD_PX = 72;
const LEFT_EXPAND_THRESHOLD_PX = 88;
const RIGHT_COLLAPSE_THRESHOLD_PX = 24;
const RIGHT_EXPAND_THRESHOLD_PX = 72;

type ResizableLayoutWrapperProps = {
	children: React.ReactNode;
	defaultLayout: [number, number, number];
};

type PanelRefHandle = {
	collapse: () => void;
	expand: () => void;
	getSize: () => { asPercentage: number; inPixels: number };
	isCollapsed: () => boolean;
	resize: (size: number | string) => void;
};

type PanelResizePayload = {
	inPixels: number;
};

function safeReadLocalStorage(key: string): string | null {
	try {
		return window.localStorage.getItem(key);
	} catch {
		return null;
	}
}

function safeWriteLocalStorage(key: string, value: string) {
	try {
		window.localStorage.setItem(key, value);
	} catch {
		// Ignore storage write failures so the UI remains interactive.
	}
}

function safeWriteCookie(layout: [number, number, number]) {
	const encoded = encodeURIComponent(JSON.stringify(layout));

	try {
		document.cookie = `${PANEL_LAYOUT_COOKIE}=${encoded}; Path=/; Max-Age=31536000; SameSite=Lax`;
		// Backward compatibility for any existing reader expecting legacy key.
		document.cookie = `${LEGACY_PANEL_LAYOUT_COOKIE}=${encoded}; Path=/; Max-Age=31536000; SameSite=Lax`;
	} catch {
		// Ignore cookie write failures.
	}
}

export function ResizableLayoutWrapper({
	children,
	defaultLayout,
}: ResizableLayoutWrapperProps) {
	const leftPanelRef = React.useRef<PanelRefHandle | null>(null);
	const rightPanelRef = React.useRef<PanelRefHandle | null>(null);

	const [leftCollapsed, setLeftCollapsed] = React.useState(false);
	const [rightCollapsed, setRightCollapsed] = React.useState(false);
	const [layoutRestored, setLayoutRestored] = React.useState(false);

	React.useEffect(() => {
		const restore = () => {
			const leftStored = safeReadLocalStorage(LEFT_COLLAPSED_KEY) === "1";
			const rightStored = safeReadLocalStorage(RIGHT_COLLAPSED_KEY) === "1";

			if (leftStored) {
				leftPanelRef.current?.collapse();
			} else {
				leftPanelRef.current?.expand();
			}

			if (rightStored) {
				rightPanelRef.current?.collapse();
			} else {
				rightPanelRef.current?.expand();
			}

			setLeftCollapsed(leftStored);
			setRightCollapsed(rightStored);
			setLayoutRestored(true);
		};

		const frame = window.requestAnimationFrame(restore);
		return () => window.cancelAnimationFrame(frame);
	}, []);

	React.useEffect(() => {
		if (!layoutRestored) {
			return;
		}
		safeWriteLocalStorage(LEFT_COLLAPSED_KEY, leftCollapsed ? "1" : "0");
	}, [leftCollapsed, layoutRestored]);

	React.useEffect(() => {
		if (!layoutRestored) {
			return;
		}
		safeWriteLocalStorage(RIGHT_COLLAPSED_KEY, rightCollapsed ? "1" : "0");
	}, [rightCollapsed, layoutRestored]);

	const toggleLeftSidebar = React.useCallback(() => {
		const panel = leftPanelRef.current;
		if (!panel) {
			return;
		}

		if (panel.isCollapsed()) {
			panel.expand();
			setLeftCollapsed(false);
			return;
		}

		panel.collapse();
		setLeftCollapsed(true);
	}, []);

	const toggleRightSidebar = React.useCallback(() => {
		const panel = rightPanelRef.current;
		if (!panel) {
			return;
		}

		if (panel.isCollapsed()) {
			panel.expand();
			setRightCollapsed(false);
			return;
		}

		panel.collapse();
		setRightCollapsed(true);
	}, []);

	const handleLeftResize = React.useCallback((size: PanelResizePayload) => {
		const panel = leftPanelRef.current;
		if (!panel) {
			return;
		}

		if (size.inPixels <= LEFT_COLLAPSE_THRESHOLD_PX && !panel.isCollapsed()) {
			panel.collapse();
		}
		if (size.inPixels >= LEFT_EXPAND_THRESHOLD_PX && panel.isCollapsed()) {
			panel.expand();
		}

		setLeftCollapsed(panel.isCollapsed());
	}, []);

	const handleRightResize = React.useCallback((size: PanelResizePayload) => {
		const panel = rightPanelRef.current;
		if (!panel) {
			return;
		}

		if (size.inPixels <= RIGHT_COLLAPSE_THRESHOLD_PX && !panel.isCollapsed()) {
			panel.collapse();
		}
		if (size.inPixels >= RIGHT_EXPAND_THRESHOLD_PX && panel.isCollapsed()) {
			panel.expand();
		}

		setRightCollapsed(panel.isCollapsed());
	}, []);

	const handleLayoutChanged = React.useCallback(
		(layoutById: Record<string, number>) => {
			const layout = [
				layoutById["dashboard-left-panel"],
				layoutById["dashboard-main-panel"],
				layoutById["dashboard-right-panel"],
			];

			if (layout.some((value) => typeof value !== "number" || !Number.isFinite(value))) {
				return;
			}

			safeWriteCookie(layout as [number, number, number]);
		},
		[]
	);

	return (
		<div className="flex h-screen w-full overflow-hidden bg-background">
			<div className="relative hidden h-full w-full md:block">
				<ResizablePanelGroup
					orientation="horizontal"
					onLayoutChanged={handleLayoutChanged}
					className="group/panes h-full w-full overflow-hidden"
				>
					<ResizablePanel
						id="dashboard-left-panel"
						defaultSize={`${defaultLayout[0]}%`}
						minSize="60px"
						maxSize="280px"
						collapsible
						collapsedSize="60px"
						panelRef={leftPanelRef}
						onResize={handleLeftResize}
						className="h-full overflow-hidden"
					>
						<LeftSidebar
							isCollapsed={leftCollapsed}
							onToggleCollapse={toggleLeftSidebar}
						/>
					</ResizablePanel>

					<ResizableHandle
						withHandle
						className="opacity-0 transition-opacity group-hover/panes:opacity-100 hover:opacity-100 focus-within:opacity-100"
					/>

					<ResizablePanel
						id="dashboard-main-panel"
						defaultSize={`${defaultLayout[1]}%`}
						className="h-full min-w-0"
					>
						<main className="scrollbar-thin h-full flex-1 overflow-y-auto bg-background">
							<div className="h-full px-4 py-5 lg:px-6">{children}</div>
						</main>
					</ResizablePanel>

					<ResizableHandle
						withHandle
						className="opacity-0 transition-opacity group-hover/panes:opacity-100 hover:opacity-100 focus-within:opacity-100"
					/>

					<ResizablePanel
						id="dashboard-right-panel"
						defaultSize={`${defaultLayout[2]}%`}
						minSize="0px"
						maxSize="420px"
						collapsible
						collapsedSize="0px"
						panelRef={rightPanelRef}
						onResize={handleRightResize}
						className="h-full overflow-hidden"
					>
						<RightSidebar
							isCollapsed={rightCollapsed}
							onToggleCollapse={toggleRightSidebar}
						/>
					</ResizablePanel>
				</ResizablePanelGroup>

				{rightCollapsed && (
					<button
						type="button"
						onClick={toggleRightSidebar}
						className="absolute right-3 top-1/2 z-50 flex size-8 -translate-y-1/2 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						aria-label="Expand right sidebar"
						title="Expand right sidebar"
					>
						<ChevronsLeft className="size-4" />
					</button>
				)}
			</div>
			<div className="scrollbar-thin h-full overflow-y-auto md:hidden">
				<main className="mx-auto min-h-full w-full max-w-4xl px-4 py-6">
					{children}
				</main>
			</div>
			<QuickCreateModal />
		</div>
	);
}
