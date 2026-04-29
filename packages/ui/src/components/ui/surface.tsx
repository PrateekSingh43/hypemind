import * as React from "react";
import { cn } from "../../lib/utils";

export interface SurfaceProps extends React.HTMLAttributes<HTMLElement> {
	/** Rendered HTML element. Defaults to `"div"`. */
	as?: "div" | "main" | "section";
}

const Surface = React.forwardRef<HTMLElement, SurfaceProps>(
	({ as: Component = "div", className, ...props }, ref) => {
		return (
			<Component
				ref={ref as React.Ref<HTMLDivElement>}
				className={cn("bg-background text-foreground", className)}
				{...props}
			/>
		);
	},
);
Surface.displayName = "Surface";

export { Surface };
