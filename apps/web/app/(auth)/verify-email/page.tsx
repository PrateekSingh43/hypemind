"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { setAccessToken } from "../../lib/api";
import { storeWorkspaceId } from "../../providers/auth-provider";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Alert } from "@repo/ui/components/alert";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";

type Status = "verifying" | "success" | "error" | "no-token";

function VerifyEmailContent() {
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
				if (data.accessToken) {
					setAccessToken(data.accessToken);
				}
				if (data.user?.workspaceId) {
					storeWorkspaceId(data.user.workspaceId);
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
					<Loader2 className="h-12 w-12 mx-auto text-foreground-subtle animate-spin mb-6" />
					<h2 className="text-2xl font-bold text-foreground mb-3">
						Verifying your email...
					</h2>
					<p className="text-foreground-muted">
						This will only take a moment.
					</p>
				</motion.div>
			)}

			{/* Success */}
			{status === "success" && (
				<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
					<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success-soft">
						<CheckCircle2 className="h-8 w-8 text-success" />
					</div>
					<h2 className="text-2xl font-bold text-foreground mb-3">
						Email verified!
					</h2>
					<p className="text-foreground-muted mb-6">
						{message} Redirecting to your dashboard...
					</p>
					<Button onClick={() => router.push("/dashboard")} size="lg" className="w-full">
						Go to Dashboard
					</Button>
				</motion.div>
			)}

			{/* Error */}
			{status === "error" && (
				<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
					<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-danger-soft">
						<XCircle className="h-8 w-8 text-danger" />
					</div>
					<h2 className="text-2xl font-bold text-foreground mb-3">
						Verification failed
					</h2>
					<p className="text-foreground-muted mb-6">
						{message}
					</p>
					<div className="space-y-3">
						<Button asChild size="lg" className="w-full">
							<Link href="/login">Go to Login</Link>
						</Button>
						<Button asChild variant="secondary" size="lg" className="w-full">
							<Link href="/signup">Create new account</Link>
						</Button>
					</div>
				</motion.div>
			)}

			{/* No token — resend form */}
			{status === "no-token" && (
				<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
					<h2 className="text-2xl font-bold text-foreground mb-3">
						Verify your email
					</h2>
					<p className="text-foreground-muted mb-6">
						Enter your email below to receive a new verification link.
					</p>

					{resendSuccess ? (
						<Alert variant="success" className="mb-4 text-left">
							If an account with that email exists, we've sent a verification link.
						</Alert>
					) : (
						<div className="space-y-3">
							<Input
								type="email"
								value={resendEmail}
								onChange={(e) => setResendEmail(e.target.value)}
								placeholder="john@example.com"
							/>
							<Button
								onClick={handleResend}
								disabled={resendLoading || !resendEmail.trim()}
								size="lg"
								className="w-full"
							>
								{resendLoading ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" />
										Sending...
									</>
								) : (
									"Send verification link"
								)}
							</Button>
						</div>
					)}

					<p className="mt-6 text-sm text-foreground-muted">
						<Link href="/login" className="font-medium text-foreground hover:underline">
							Back to login
						</Link>
					</p>
				</motion.div>
			)}
		</div>
	);
}

export default function VerifyEmailPage() {
	return (
		<Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin h-6 w-6" /></div>}>
			<VerifyEmailContent />
		</Suspense>
	);
}
