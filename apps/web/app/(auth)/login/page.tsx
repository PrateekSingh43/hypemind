"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Field } from "@repo/ui/components/field";
import { Alert } from "@repo/ui/components/alert";
import { api, setAccessToken } from "../../lib/api";

function LoginContent() {

	const searchParams = useSearchParams();
	const router = useRouter();
	const registeredInfo = searchParams.get("registered");

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (!email.trim()) {
			setError("Email is required");
			return;
		}
		if (!password) {
			setError("Password is required");
			return;
		}

		setIsLoading(true);

		try {
			const res = await api.post<{data: {accessToken:string}}>( "/auth/login", {
				email: email.trim().toLowerCase(),
				password,
			});

			const accessToken = res.data?.accessToken;
			if (accessToken) {
				setAccessToken(accessToken); 
				router.push("/dashboard");
			} else {
				throw new Error("Login failed: No access token received");
			}
		} catch (err: any) {
			setError(err.message || "Failed to sign in");
			setIsLoading(false);
		}
	};

	return (
		<div>
			<h2 className="text-2xl font-bold text-foreground mb-2">
				Welcome back
			</h2>
			<p className="text-foreground-muted mb-8">
				Sign in to access your second brain.
			</p>

			{registeredInfo && (
				<motion.div
					initial={{ opacity: 0, y: -8 }}
					animate={{ opacity: 1, y: 0 }}
					className="mb-6"
				>
					<Alert variant="success">Account verified! Please sign in.</Alert>
				</motion.div>
			)}

			<form onSubmit={handleSubmit} className="space-y-4">
				{error && (
					<motion.div
						initial={{ opacity: 0, y: -8 }}
						animate={{ opacity: 1, y: 0 }}
					>
						<Alert variant="danger">{error}</Alert>
					</motion.div>
				)}

				{/* Email */}
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

				{/* Password */}
				<Field
					label="Password"
					htmlFor="password"
					labelRight={
						<Link
							href="/forgot-password"
							className="text-xs font-medium text-foreground-muted hover:text-foreground transition-colors"
						>
							Forgot password?
						</Link>
					}
				>
					<div className="relative">
						<Input
							id="password"
							type={showPassword ? "text" : "password"}
							autoComplete="current-password"
							required
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Enter your password"
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
				</Field>

				{/* Submit */}
				<Button type="submit" disabled={isLoading} size="lg" className="w-full">
					{isLoading ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" />
							Signing in...
						</>
					) : (
						"Sign in"
					)}
				</Button>
			</form>

			{/* Divider */}
			<div className="my-6 flex items-center gap-3">
				<div className="flex-1 h-px bg-border" />
				<span className="text-xs text-foreground-subtle">or</span>
				<div className="flex-1 h-px bg-border" />
			</div>

			{/* Google OAuth placeholder */}
			<Button type="button" variant="secondary" size="lg" className="w-full" disabled>
				<svg className="h-4 w-4" viewBox="0 0 24 24">
					<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
					<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
					<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
					<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
				</svg>
				Continue with Google (coming soon)
			</Button>

			{/* Sign up link */}
			<p className="mt-6 text-center text-sm text-foreground-muted">
				Don't have an account?{" "}
				<Link href="/signup" className="font-medium text-foreground hover:underline">
					Sign up
				</Link>
			</p>
		</div>
	);
}

export default function LoginPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<LoginContent />
		</Suspense>
	);
}
