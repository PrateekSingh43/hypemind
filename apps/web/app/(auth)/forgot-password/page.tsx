"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

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
				<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
					<CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
				</div>
				<h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
					Check your email
				</h2>
				<p className="text-zinc-600 dark:text-zinc-400 mb-2 max-w-sm mx-auto">
					If an account with{" "}
					<span className="font-medium text-zinc-900 dark:text-white">{email}</span>{" "}
					exists, we've sent a password reset link.
				</p>
				<p className="text-zinc-500 text-sm mb-6">
					The link expires in 1 hour.
				</p>
				<Link
					href="/login"
					className="inline-flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-white hover:underline"
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
				className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-8"
			>
				<ArrowLeft className="h-4 w-4" />
				Back to login
			</Link>

			<h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
				Reset your password
			</h2>
			<p className="text-zinc-600 dark:text-zinc-400 mb-8">
				Enter your email and we'll send you a reset link.
			</p>

			<form onSubmit={handleSubmit} className="space-y-4">
				{error && (
					<motion.div
						initial={{ opacity: 0, y: -8 }}
						animate={{ opacity: 1, y: 0 }}
						className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400"
					>
						{error}
					</motion.div>
				)}

				<div>
					<label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
						Email address
					</label>
					<input
						id="email"
						type="email"
						autoComplete="email"
						required
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="john@example.com"
						className="w-full h-11 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 px-4 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white/20 focus:border-transparent transition-shadow"
					/>
				</div>

				<button
					type="submit"
					disabled={isLoading}
					className="w-full h-11 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
				>
					{isLoading ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" />
							Sending link...
						</>
					) : (
						"Send reset link"
					)}
				</button>
			</form>
		</div>
	);
}
