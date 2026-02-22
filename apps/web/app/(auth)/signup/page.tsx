"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";

export default function SignupPage() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (!name.trim()) {
			setError("Name is required");
			return;
		}
		if (!email.trim()) {
			setError("Email is required");
			return;
		}
		if (password.length < 8) {
			setError("Password must be at least 8 characters");
			return;
		}

		setIsLoading(true);

		try {
			const res = await fetch(`${API_BASE}/auth/register`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.message || "Something went wrong");
			}

			const devVerificationToken = data?.data?.devVerificationToken as string | undefined;
			if (devVerificationToken) {
				router.push(`/verify-email?token=${encodeURIComponent(devVerificationToken)}`);
				return;
			}

			setSuccess(true);
		} catch (err: any) {
			setError(err.message || "Failed to create account");
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
				<p className="text-zinc-600 dark:text-zinc-400 mb-6 max-w-sm mx-auto">
					We've sent a verification link to{" "}
					<span className="font-medium text-zinc-900 dark:text-white">{email}</span>.
					Click the link to activate your account.
				</p>
				<div className="space-y-3">
					<button
						onClick={() => router.push("/login")}
						className="w-full h-11 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-sm hover:opacity-90 transition-opacity"
					>
						Go to Login
					</button>
					<button
						onClick={async () => {
							try {
								await fetch(`${API_BASE}/auth/resend-verification`, {
									method: "POST",
									headers: { "Content-Type": "application/json" },
									body: JSON.stringify({ email }),
								});
							} catch { }
						}}
						className="w-full h-11 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
					>
						Resend verification email
					</button>
				</div>
			</motion.div>
		);
	}

	return (
		<div>
			<h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
				Create your account
			</h2>
			<p className="text-zinc-600 dark:text-zinc-400 mb-8">
				Start organizing your second brain in seconds.
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

				{/* Name */}
				<div>
					<label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
						Full name
					</label>
					<input
						id="name"
						type="text"
						autoComplete="name"
						required
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="John Doe"
						className="w-full h-11 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 px-4 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white/20 focus:border-transparent transition-shadow"
					/>
				</div>

				{/* Email */}
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

				{/* Password */}
				<div>
					<label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
						Password
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

				{/* Submit */}
				<button
					type="submit"
					disabled={isLoading}
					className="w-full h-11 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
				>
					{isLoading ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" />
							Creating account...
						</>
					) : (
						"Create account"
					)}
				</button>
			</form>

			{/* Divider */}
			<div className="my-6 flex items-center gap-3">
				<div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
				<span className="text-xs text-zinc-400">or</span>
				<div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
			</div>

			{/* Google OAuth placeholder */}
			<button
				type="button"
				disabled
				className="w-full h-11 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
			>
				<svg className="h-4 w-4" viewBox="0 0 24 24">
					<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
					<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
					<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
					<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
				</svg>
				Continue with Google (coming soon)
			</button>

			{/* Login link */}
			<p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
				Already have an account?{" "}
				<Link href="/login" className="font-medium text-zinc-900 dark:text-white hover:underline">
					Sign in
				</Link>
			</p>
		</div>
	);
}
