"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FameLogo } from "@/components/ui/fame-logo";
import { ArrowLeft, Mail, AlertCircle, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!email) {
			setError("Please enter your email address");
			return;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			setError("Please enter a valid email address");
			return;
		}

		setLoading(true);
		setError("");

		try {
			const response = await fetch("/api/auth/forgot-password", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email }),
			});

			const result = await response.json();

			if (result.success) {
				setSuccess(true);
			} else {
				setError(result.error?.message || "Failed to send reset email");
			}
		} catch (error) {
			console.error("Forgot password error:", error);
			setError("Network error. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	if (success) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-purple-900 to-pink-900 text-white flex items-center justify-center p-4">
				<div className="w-full max-w-md space-y-8">
					<div className="text-center">
						<div className="flex justify-center mb-6">
							<FameLogo width={80} height={80} />
						</div>
					</div>

					<Card className="bg-purple-800/50 border-purple-600">
						<CardContent className="p-8">
							<div className="text-center space-y-4">
								<CheckCircle className="h-16 w-16 text-green-400 mx-auto" />
								<h2 className="text-2xl font-bold text-white">
									Check Your Email
								</h2>
								<p className="text-gray-400">
									We've sent a password reset link to{" "}
									<span className="text-white font-medium">
										{email}
									</span>
								</p>
								<p className="text-sm text-gray-500">
									If you don't see the email, check your spam
									folder.
								</p>
								<div className="pt-4">
									<Link href="/login">
										<Button
											variant="outline"
											className="border-gray-600 text-gray-300 hover:bg-gray-800"
										>
											<ArrowLeft className="h-4 w-4 mr-2" />
											Back to Login
										</Button>
									</Link>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-900 to-pink-900 text-white flex items-center justify-center p-4">
			<div className="w-full max-w-md space-y-8">
				{/* Logo and Header */}
				<div className="text-center">
					<div className="flex justify-center mb-6">
						<FameLogo width={80} height={80} />
					</div>
					<h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
						Reset Password
					</h1>
					<p className="text-gray-400 text-lg">
						Enter your email to receive a reset link
					</p>
				</div>

				{/* Reset Form */}
				<Card className="bg-purple-800/50 border-purple-600">
					<CardHeader>
						<CardTitle className="text-white text-center">
							Forgot Password
						</CardTitle>
						<CardDescription className="text-gray-400 text-center">
							We'll send you a link to reset your password
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-6">
							{/* Error Alert */}
							{error && (
								<Alert className="bg-red-900/20 border-red-800 text-red-400">
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}

							{/* Email Field */}
							<div className="space-y-2">
								<Label
									htmlFor="email"
									className="text-gray-300"
								>
									Email Address
								</Label>
								<Input
									id="email"
									name="email"
									type="email"
									value={email}
									onChange={(e) => {
										setEmail(e.target.value);
										if (error) setError("");
									}}
									placeholder="Enter your email address"
									required
									className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
								/>
							</div>

							{/* Submit Button */}
							<Button
								type="submit"
								disabled={loading}
								className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3"
							>
								{loading ? (
									<div className="flex items-center">
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
										Sending Reset Link...
									</div>
								) : (
									<div className="flex items-center">
										<Mail className="h-4 w-4 mr-2" />
										Send Reset Link
									</div>
								)}
							</Button>
						</form>

						{/* Links */}
						<div className="mt-6 space-y-4">
							<div className="text-center">
								<Link
									href="/login"
									className="text-purple-400 hover:text-purple-300 text-sm flex items-center justify-center"
								>
									<ArrowLeft className="h-4 w-4 mr-1" />
									Back to Login
								</Link>
							</div>
							<div className="text-center text-gray-400">
								Don't have an account?{" "}
								<Link
									href="/register"
									className="text-purple-400 hover:text-purple-300 font-medium"
								>
									Sign up here
								</Link>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Footer */}
				<div className="text-center text-gray-500 text-sm">
					<p>(c) 2025 FAME System. All rights reserved.</p>
				</div>
			</div>
		</div>
	);
}
