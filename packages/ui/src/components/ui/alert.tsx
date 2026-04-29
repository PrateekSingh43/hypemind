import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const alertVariants = cva("rounded-lg border px-4 py-3 text-sm", {
	variants: {
		variant: {
			info: "bg-info-soft border-info/20 text-info",
			success: "bg-success-soft border-success/20 text-success",
			warning: "bg-warning-soft border-warning/20 text-warning",
			danger: "bg-danger-soft border-danger/20 text-danger",
		},
	},
	defaultVariants: {
		variant: "info",
	},
});

export interface AlertProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof alertVariants> {}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
	({ className, variant, ...props }, ref) => {
		return (
			<div
				ref={ref}
				role="alert"
				className={cn(alertVariants({ variant, className }))}
				{...props}
			/>
		);
	},
);
Alert.displayName = "Alert";

export { Alert, alertVariants };
