"use client"

import { GripVertical } from "lucide-react"
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from "react-resizable-panels"

import { cn } from "../../lib/utils"

const ResizablePanelGroup = ({
	className,
	...props
}: React.ComponentProps<typeof PanelGroup>) => (
	<PanelGroup
		className={cn(
			"flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
			className
		)}
		{...props}
	/>
)

const ResizablePanel = Panel

const ResizableHandle = ({
	withHandle,
	className,
	...props
}: React.ComponentProps<typeof PanelResizeHandle> & {
	withHandle?: boolean
}) => (
	<PanelResizeHandle
		className={cn(
			"relative flex w-px items-center justify-center bg-transparent after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 after:bg-transparent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/60 focus-visible:ring-offset-0 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90 hover:after:bg-border/70 transition-colors z-50",
			className
		)}
		{...props}
	>
		{withHandle && (
			<div className="z-10 flex h-5 w-4 items-center justify-center rounded-sm bg-muted/80 shadow-none">
				<GripVertical className="h-3 w-3 text-muted-foreground" />
			</div>
		)}
	</PanelResizeHandle>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
