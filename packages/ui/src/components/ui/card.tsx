import * as React from "react";
import { cn } from "../../lib/utils";

const Card = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
	return (
		<div
			ref={ref}
			className={cn(
				"rounded-xl border border-border bg-surface-elevated p-6 shadow-soft",
				className,
			)}
			{...props}
		/>
	);
});
Card.displayName = "Card";

export { Card };
