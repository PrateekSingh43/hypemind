"use client";

import * as React from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@repo/ui/components/resizable";
import { LeftSidebar } from "../../components/dashboard/left-sidebar";
import { RightSidebar } from "../../components/dashboard/right-sidebar";
import { QuickCreateModal } from "../../components/dashboard/quick-create-modal";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="h-dvh w-full overflow-hidden bg-background">
			<div className="hidden h-full md:block">
				<ResizablePanelGroup id="dashboard-group" orientation="horizontal" className="h-full w-full">
					<ResizablePanel id="left-sidebar" defaultSize="20%" minSize="220px" maxSize="30%" className="min-w-[220px]">
						<LeftSidebar />
					</ResizablePanel>

					<ResizableHandle id="left-handle" withHandle />

					<ResizablePanel id="main-content" defaultSize="56%" minSize="520px" className="min-w-0">
						<main className="h-full overflow-y-auto">{children}</main>
					</ResizablePanel>

					<ResizableHandle id="right-handle" withHandle />

					<ResizablePanel id="right-sidebar" defaultSize="24%" minSize="260px" maxSize="34%" className="min-w-[260px]">
						<RightSidebar />
					</ResizablePanel>
				</ResizablePanelGroup>
			</div>
			<div className="h-full overflow-y-auto md:hidden">
				<main className="min-h-full">{children}</main>
			</div>
			<QuickCreateModal />
		</div>
	);
}
