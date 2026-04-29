"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Field } from "@repo/ui/components/field";
import { Alert } from "@repo/ui/components/alert";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";

function ResetPasswordContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");

	const [newPassword, setNewPassword] = useState("");
	const [confirmNewPassword, setConfirmNewPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (newPassword.length < 8) {
			setError("Password must be at least 8 characters");
			return;
		}
		if (newPassword !== confirmNewPassword) {
			setError("Passwords don't match");
			return;
		}

		setIsLoading(true);

		try {
			const res = await fetch(`${API_BASE}/auth/reset-password`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token, newPassword }),
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
				<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-warning-soft">
					<XCircle className="h-8 w-8 text-warning" />
				</div>
				<h2 className="text-2xl font-bold text-foreground mb-3">
					Invalid reset link
				</h2>
				<p className="text-foreground-muted mb-6">
					This link is invalid or has expired. Please request a new one.
				</p>
				<Button asChild size="lg" className="w-full">
					<Link href="/forgot-password">Request new link</Link>
				</Button>
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
				<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success-soft">
					<CheckCircle2 className="h-8 w-8 text-success" />
				</div>
				<h2 className="text-2xl font-bold text-foreground mb-3">
					Password updated
				</h2>
				<p className="text-foreground-muted mb-6">
					Your password has been reset. You can now sign in with your new password.
				</p>
				<Button onClick={() => router.push("/login")} size="lg" className="w-full">
					Sign in
				</Button>
			</motion.div>
		);
	}

	// Form
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
				Set new password
			</h2>
			<p className="text-foreground-muted mb-8">
				Enter your new password below.
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

				{/* New Password */}
				<Field label="New password" htmlFor="password">
					<div className="relative">
						<Input
							id="password"
							type={showPassword ? "text" : "password"}
							autoComplete="new-password"
							required
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							placeholder="At least 8 characters"
							className="pr-11"
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-subtle hover:text-foreground-muted transition-colors"
						>
							{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
						</button>
					</div>
					{newPassword.length > 0 && (
						<div className="mt-2 flex items-center gap-2">
							<div className="flex-1 h-1 rounded-full overflow-hidden bg-border">
								<div
									className={`h-full rounded-full transition-all ${newPassword.length >= 8
										? "w-full bg-success"
										: newPassword.length >= 8
											? "w-2/3 bg-warning"
											: "w-1/3 bg-danger"
										}`}
								/>
							</div>
							<span className="text-xs text-foreground-subtle">
								{newPassword.length >= 12 ? "Strong" : newPassword.length >= 8 ? "Good" : "Weak"}
							</span>
						</div>
					)}
				</Field>

				{/* Confirm Password */}
				<Field
					label="Confirm password"
					htmlFor="confirmPassword"
					error={confirmNewPassword.length > 0 && newPassword !== confirmNewPassword ? "Passwords don't match" : undefined}
				>
					<Input
						id="confirmNewPassword"
						type={showPassword ? "text" : "password"}
						autoComplete="new-password"
						required
						value={confirmNewPassword}
						onChange={(e) => setConfirmNewPassword(e.target.value)}
						placeholder="Re-enter your password"
					/>
				</Field>

				<Button type="submit" disabled={isLoading} size="lg" className="w-full">
					{isLoading ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" />
							Resetting...
						</>
					) : (
						"Reset password"
					)}
				</Button>
			</form>
		</div>
	);
}

export default function ResetPasswordPage() {
	return (
		<Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin h-6 w-6" /></div>}>
			<ResetPasswordContent />
		</Suspense>
	);
}
