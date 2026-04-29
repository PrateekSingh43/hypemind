"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Field } from "@repo/ui/components/field";
import { Alert } from "@repo/ui/components/alert";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (!email.trim()) {
			setError("Email is required");
			return;
		}

		setIsLoading(true);

		try {
			const res = await fetch(`${API_BASE}/auth/forgot-password`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: email.trim().toLowerCase() }),
			});

			// Always show success to prevent email enumeration
			setSuccess(true);
		} catch {
			setSuccess(true); // Still show success — no email enumeration
		} finally {
			setIsLoading(false);
		}
	};

	if (success) {
		return (
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				className="text-center"
			>
				<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success-soft">
					<CheckCircle2 className="h-8 w-8 text-success" />
				</div>
				<h2 className="text-2xl font-bold text-foreground mb-3">
					Check your email
				</h2>
				<p className="text-foreground-muted mb-2 max-w-sm mx-auto">
					If an account with{" "}
					<span className="font-medium text-foreground">{email}</span>{" "}
					exists, we've sent a password reset link.
				</p>
				<p className="text-foreground-subtle text-sm mb-6">
					The link expires in 1 hour.
				</p>
				<Link
					href="/login"
					className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:underline"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to login
				</Link>
			</motion.div>
		);
	}

	return (
		<div>
			<Link
				href="/login"
				className="inline-flex items-center gap-2 text-sm text-foreground-subtle hover:text-foreground transition-colors mb-8"
			>
				<ArrowLeft className="h-4 w-4" />
				Back to login
			</Link>

			<h2 className="text-2xl font-bold text-foreground mb-2">
				Reset your password
			</h2>
			<p className="text-foreground-muted mb-8">
				Enter your email and we'll send you a reset link.
			</p>

			<form onSubmit={handleSubmit} className="space-y-4">
				{error && (
					<motion.div
						initial={{ opacity: 0, y: -8 }}
						animate={{ opacity: 1, y: 0 }}
					>
						<Alert variant="danger">{error}</Alert>
					</motion.div>
				)}

				<Field label="Email address" htmlFor="email">
					<Input
						id="email"
						type="email"
						autoComplete="email"
						required
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="john@example.com"
					/>
				</Field>

				<Button type="submit" disabled={isLoading} size="lg" className="w-full">
					{isLoading ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" />
							Sending link...
						</>
					) : (
						"Send reset link"
					)}
				</Button>
			</form>
		</div>
	);
}
