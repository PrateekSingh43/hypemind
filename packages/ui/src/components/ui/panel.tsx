import * as React from "react";
import { cn } from "../../lib/utils";

const Panel = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
	return (
		<div
			ref={ref}
			className={cn(
				"rounded-lg border border-border bg-panel p-4",
				className,
			)}
			{...props}
		/>
	);
});
Panel.displayName = "Panel";

export { Panel };
