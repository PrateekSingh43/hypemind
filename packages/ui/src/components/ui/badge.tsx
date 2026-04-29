import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
	"inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
	{
		variants: {
			variant: {
				default: "bg-secondary text-secondary-foreground",
				primary: "bg-primary-soft text-primary",
				success: "bg-success-soft text-success",
				warning: "bg-warning-soft text-warning",
				danger: "bg-danger-soft text-danger",
				info: "bg-info-soft text-info",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

export interface BadgeProps
	extends React.HTMLAttributes<HTMLSpanElement>,
		VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
	({ className, variant, ...props }, ref) => {
		return (
			<span
				ref={ref}
				className={cn(badgeVariants({ variant, className }))}
				{...props}
			/>
		);
	},
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
