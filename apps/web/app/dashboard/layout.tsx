"use client";

import * as React from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@repo/ui/components/resizable";
import { ChevronsLeft } from "lucide-react";
import type { PanelImperativeHandle, PanelSize } from "react-resizable-panels";
import { LeftSidebar } from "../../components/dashboard/left-sidebar";
import { RightSidebar } from "../../components/dashboard/right-sidebar";
import { QuickCreateModal } from "../../components/dashboard/quick-create-modal";

const DASHBOARD_LAYOUT_AUTOSAVE_ID = "hm:dashboard-layout:v1";
const LEFT_COLLAPSED_KEY = "hm:dashboard:left-collapsed:v1";
const RIGHT_COLLAPSED_KEY = "hm:dashboard:right-collapsed:v1";
const LEFT_COLLAPSE_THRESHOLD_PX = 72;
const LEFT_EXPAND_THRESHOLD_PX = 88;
const RIGHT_COLLAPSE_THRESHOLD_PX = 24;
const RIGHT_EXPAND_THRESHOLD_PX = 72;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	const leftPanelRef = React.useRef<PanelImperativeHandle | null>(null);
	const rightPanelRef = React.useRef<PanelImperativeHandle | null>(null);

	const [leftCollapsed, setLeftCollapsed] = React.useState(false);
	const [rightCollapsed, setRightCollapsed] = React.useState(false);
	const [layoutRestored, setLayoutRestored] = React.useState(false);

	React.useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const restore = () => {
			const leftStored = window.localStorage.getItem(LEFT_COLLAPSED_KEY) === "1";
			const rightStored = window.localStorage.getItem(RIGHT_COLLAPSED_KEY) === "1";

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
		if (!layoutRestored || typeof window === "undefined") {
			return;
		}
		window.localStorage.setItem(LEFT_COLLAPSED_KEY, leftCollapsed ? "1" : "0");
	}, [leftCollapsed, layoutRestored]);

	React.useEffect(() => {
		if (!layoutRestored || typeof window === "undefined") {
			return;
		}
		window.localStorage.setItem(RIGHT_COLLAPSED_KEY, rightCollapsed ? "1" : "0");
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

	const handleLeftResize = React.useCallback((size: PanelSize) => {
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

	const handleRightResize = React.useCallback((size: PanelSize) => {
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

	return (
		<div className="flex h-screen w-full overflow-hidden bg-background">
			<div className="relative hidden h-full w-full md:block">
				<ResizablePanelGroup
					orientation="horizontal"
					autoSaveId={DASHBOARD_LAYOUT_AUTOSAVE_ID}
					className="group/panes h-full w-full overflow-hidden"
				>
					<ResizablePanel
						defaultSize="240px"
						minSize="60px"
						maxSize="280px"
						collapsible
						collapsedSize="60px"
						panelRef={leftPanelRef}
						onResize={handleLeftResize}
						className="h-full overflow-hidden"
					>
						<LeftSidebar isCollapsed={leftCollapsed} onToggleCollapse={toggleLeftSidebar} />
					</ResizablePanel>

					<ResizableHandle withHandle className="opacity-0 transition-opacity group-hover/panes:opacity-100 hover:opacity-100 focus-within:opacity-100" />

					<ResizablePanel className="h-full min-w-0">
						<main className="scrollbar-thin flex-1 h-full overflow-y-auto bg-background">
							<div className="h-full px-4 py-5 lg:px-6">{children}</div>
						</main>
					</ResizablePanel>

					<ResizableHandle withHandle className="opacity-0 transition-opacity group-hover/panes:opacity-100 hover:opacity-100 focus-within:opacity-100" />

					<ResizablePanel
						defaultSize="320px"
						minSize="0px"
						maxSize="420px"
						collapsible
						collapsedSize="0px"
						panelRef={rightPanelRef}
						onResize={handleRightResize}
						className="h-full overflow-hidden"
					>
						<RightSidebar isCollapsed={rightCollapsed} onToggleCollapse={toggleRightSidebar} />
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
				<main className="mx-auto min-h-full w-full max-w-4xl px-4 py-6">{children}</main>
			</div>
			<QuickCreateModal />
		</div>
	);
}
