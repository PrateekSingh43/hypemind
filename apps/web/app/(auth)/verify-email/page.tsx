"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { setAccessToken } from "../../lib/api";
import { storeWorkspaceId } from "../../providers/auth-provider";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";

type Status = "verifying" | "success" | "error" | "no-token";

export default function VerifyEmailPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");

	const [status, setStatus] = useState<Status>(token ? "verifying" : "no-token");
	const [message, setMessage] = useState("");
	const [resendEmail, setResendEmail] = useState("");
	const [resendLoading, setResendLoading] = useState(false);
	const [resendSuccess, setResendSuccess] = useState(false);

	useEffect(() => {
		if (!token) return;

		(async () => {
			try {
				const res = await fetch(`${API_BASE}/auth/verify-email`, {
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ token }),
				});

				const data = await res.json();

				if (!res.ok) {
					throw new Error(data.message || "Verification failed");
				}

				// Auto-login: set the access token from the response
				if (data.data?.accessToken) {
					setAccessToken(data.data.accessToken);
				}
				if (data.data?.user?.workspaceId) {
					storeWorkspaceId(data.data.user.workspaceId);
				}

				setStatus("success");
				setMessage("Your email has been verified successfully!");

				// Auto-redirect to dashboard after 3 seconds
				setTimeout(() => {
					window.location.assign("/dashboard");
				}, 3000);
			} catch (err: any) {
				setStatus("error");
				setMessage(err.message || "Verification failed. The link may have expired.");
			}
		})();
	}, [token, router]);

	const handleResend = async () => {
		if (!resendEmail.trim()) return;
		setResendLoading(true);
		try {
			await fetch(`${API_BASE}/auth/resend-verification`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: resendEmail.trim().toLowerCase() }),
			});
			setResendSuccess(true);
		} catch {
			// Silently succeed — don't reveal if email exists
			setResendSuccess(true);
		} finally {
			setResendLoading(false);
		}
	};

	return (
		<div className="text-center">
			{/* Verifying */}
			{status === "verifying" && (
				<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
					<Loader2 className="h-12 w-12 mx-auto text-zinc-400 animate-spin mb-6" />
					<h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
						Verifying your email...
					</h2>
					<p className="text-zinc-600 dark:text-zinc-400">
						This will only take a moment.
					</p>
				</motion.div>
			)}

			{/* Success */}
			{status === "success" && (
				<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
					<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
						<CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
					</div>
					<h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
						Email verified!
					</h2>
					<p className="text-zinc-600 dark:text-zinc-400 mb-6">
						{message} Redirecting to your dashboard...
					</p>
					<button
						onClick={() => router.push("/dashboard")}
						className="w-full h-11 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-sm hover:opacity-90 transition-opacity"
					>
						Go to Dashboard
					</button>
				</motion.div>
			)}

			{/* Error */}
			{status === "error" && (
				<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
					<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
						<XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
					</div>
					<h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
						Verification failed
					</h2>
					<p className="text-zinc-600 dark:text-zinc-400 mb-6">
						{message}
					</p>
					<div className="space-y-3">
						<Link
							href="/login"
							className="block w-full h-11 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-sm hover:opacity-90 transition-opacity leading-[2.75rem] text-center"
						>
							Go to Login
						</Link>
						<Link
							href="/signup"
							className="block w-full h-11 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors leading-[2.75rem] text-center"
						>
							Create new account
						</Link>
					</div>
				</motion.div>
			)}

			{/* No token — resend form */}
			{status === "no-token" && (
				<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
					<h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
						Verify your email
					</h2>
					<p className="text-zinc-600 dark:text-zinc-400 mb-6">
						Enter your email below to receive a new verification link.
					</p>

					{resendSuccess ? (
						<div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400 mb-4">
							If an account with that email exists, we've sent a verification link.
						</div>
					) : (
						<div className="space-y-3">
							<input
								type="email"
								value={resendEmail}
								onChange={(e) => setResendEmail(e.target.value)}
								placeholder="john@example.com"
								className="w-full h-11 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 px-4 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white/20 focus:border-transparent transition-shadow"
							/>
							<button
								onClick={handleResend}
								disabled={resendLoading || !resendEmail.trim()}
								className="w-full h-11 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
							>
								{resendLoading ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" />
										Sending...
									</>
								) : (
									"Send verification link"
								)}
							</button>
						</div>
					)}

					<p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
						<Link href="/login" className="font-medium text-zinc-900 dark:text-white hover:underline">
							Back to login
						</Link>
					</p>
				</motion.div>
			)}
		</div>
	);
}
