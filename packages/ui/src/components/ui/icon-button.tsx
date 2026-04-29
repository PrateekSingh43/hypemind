import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const iconButtonVariants = cva(
	"inline-flex shrink-0 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:pointer-events-none disabled:opacity-50",
	{
		variants: {
			variant: {
				ghost:
					"text-foreground-muted hover:bg-surface-elevated hover:text-foreground",
				secondary:
					"bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80",
				primary:
					"bg-primary text-primary-foreground hover:bg-primary-hover",
			},
			size: {
				sm: "size-7 [&_svg]:size-3.5",
				md: "size-8 [&_svg]:size-4",
				lg: "size-9 [&_svg]:size-[18px]",
			},
		},
		defaultVariants: {
			variant: "ghost",
			size: "md",
		},
	},
);

export interface IconButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof iconButtonVariants> {}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
	({ className, variant, size, ...props }, ref) => {
		return (
			<button
				className={cn(iconButtonVariants({ variant, size, className }))}
				ref={ref}
				{...props}
			/>
		);
	},
);
IconButton.displayName = "IconButton";

export { IconButton, iconButtonVariants };
