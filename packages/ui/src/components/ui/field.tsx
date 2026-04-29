import * as React from "react";
import { cn } from "../../lib/utils";

export interface FieldProps {
	/** Visible label text. */
	label: string;
	/** Forwarded to `<label htmlFor>`. */
	htmlFor?: string;
	/** Validation error — displayed below children. */
	error?: string;
	/** Hint text — displayed below children when no error is present. */
	hint?: string;
	/** Extra content rendered inline with the label (e.g. a "Forgot password?" link). */
	labelRight?: React.ReactNode;
	children: React.ReactNode;
	className?: string;
}

function Field({
	label,
	htmlFor,
	error,
	hint,
	labelRight,
	children,
	className,
}: FieldProps) {
	return (
		<div className={className}>
			{labelRight ? (
				<div className="flex items-center justify-between mb-1.5">
					<label
						htmlFor={htmlFor}
						className="block text-sm font-medium text-foreground"
					>
						{label}
					</label>
					{labelRight}
				</div>
			) : (
				<label
					htmlFor={htmlFor}
					className="block text-sm font-medium text-foreground mb-1.5"
				>
					{label}
				</label>
			)}
			{children}
			{error && (
				<p className="mt-1.5 text-xs text-danger">{error}</p>
			)}
			{hint && !error && (
				<p className="mt-1.5 text-xs text-foreground-subtle">{hint}</p>
			)}
		</div>
	);
}

export { Field };
