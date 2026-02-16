"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";

export default function ResetPasswordPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");

	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (password.length < 8) {
			setError("Password must be at least 8 characters");
			return;
		}
		if (password !== confirmPassword) {
			setError("Passwords don't match");
			return;
		}

		setIsLoading(true);

		try {
			const res = await fetch(`${API_BASE}/auth/reset-password`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token, password }),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.message || "Failed to reset password");
			}

			setSuccess(true);
		} catch (err: any) {
			setError(err.message || "Failed to reset password");
		} finally {
			setIsLoading(false);
		}
	};

	// No token in URL
	if (!token) {
		return (
			<div className="text-center">
				<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
					<XCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
				</div>
				<h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
					Invalid reset link
				</h2>
				<p className="text-zinc-600 dark:text-zinc-400 mb-6">
					This link is invalid or has expired. Please request a new one.
				</p>
				<Link
					href="/forgot-password"
					className="inline-flex items-center justify-center w-full h-11 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-sm hover:opacity-90 transition-opacity"
				>
					Request new link
				</Link>
			</div>
		);
	}

	// Success
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
					Password updated
				</h2>
				<p className="text-zinc-600 dark:text-zinc-400 mb-6">
					Your password has been reset. You can now sign in with your new password.
				</p>
				<button
					onClick={() => router.push("/login")}
					className="w-full h-11 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-sm hover:opacity-90 transition-opacity"
				>
					Sign in
				</button>
			</motion.div>
		);
	}

	// Form
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
				Set new password
			</h2>
			<p className="text-zinc-600 dark:text-zinc-400 mb-8">
				Enter your new password below.
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

				{/* New Password */}
				<div>
					<label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
						New password
					</label>
					<div className="relative">
						<input
							id="password"
							type={showPassword ? "text" : "password"}
							autoComplete="new-password"
							required
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="At least 8 characters"
							className="w-full h-11 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 px-4 pr-11 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white/20 focus:border-transparent transition-shadow"
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
						>
							{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
						</button>
					</div>
					{password.length > 0 && (
						<div className="mt-2 flex items-center gap-2">
							<div className="flex-1 h-1 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700">
								<div
									className={`h-full rounded-full transition-all ${password.length >= 12
											? "w-full bg-emerald-500"
											: password.length >= 8
												? "w-2/3 bg-amber-500"
												: "w-1/3 bg-red-500"
										}`}
								/>
							</div>
							<span className="text-xs text-zinc-500">
								{password.length >= 12 ? "Strong" : password.length >= 8 ? "Good" : "Weak"}
							</span>
						</div>
					)}
				</div>

				{/* Confirm Password */}
				<div>
					<label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
						Confirm password
					</label>
					<input
						id="confirmPassword"
						type={showPassword ? "text" : "password"}
						autoComplete="new-password"
						required
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						placeholder="Re-enter your password"
						className="w-full h-11 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 px-4 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white/20 focus:border-transparent transition-shadow"
					/>
					{confirmPassword.length > 0 && password !== confirmPassword && (
						<p className="mt-1.5 text-xs text-red-500">Passwords don't match</p>
					)}
				</div>

				<button
					type="submit"
					disabled={isLoading}
					className="w-full h-11 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
				>
					{isLoading ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" />
							Resetting...
						</>
					) : (
						"Reset password"
					)}
				</button>
			</form>
		</div>
	);
}
