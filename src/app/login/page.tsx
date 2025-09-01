"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";

export default function LoginPage() {
	const router = useRouter();
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
		// Clear error when user starts typing
		if (error) setError("");
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			const result = await response.json();

			if (result.success) {
				// Redirect based on the redirect URL from the API
				router.push(result.data.redirectUrl || "/");
			} else {
				setError(result.error?.message || "Login failed");
			}
		} catch (error) {
			console.error("Login error:", error);
			setError("Network error. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
			<div className="w-full max-w-md space-y-8">
				{/* Logo and Header */}
				<div className="text-center">
					<div className="flex justify-center mb-6">
						<FameLogo width={80} height={80} />
					</div>
					<h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
						Welcome Back
					</h1>
					<p className="text-gray-400 text-lg">
						Sign in to your FAME account
					</p>
				</div>

				{/* Login Form */}
				<Card className="bg-gray-900 border-gray-800">
					<CardHeader>
						<CardTitle className="text-white text-center">
							Sign In
						</CardTitle>
						<CardDescription className="text-gray-400 text-center">
							Enter your credentials to access your account
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
									value={formData.email}
									onChange={handleInputChange}
									placeholder="Enter your email"
									required
									className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
								/>
							</div>

							{/* Password Field */}
							<div className="space-y-2">
								<Label
									htmlFor="password"
									className="text-gray-300"
								>
									Password
								</Label>
								<div className="relative">
									<Input
										id="password"
										name="password"
										type={
											showPassword ? "text" : "password"
										}
										value={formData.password}
										onChange={handleInputChange}
										placeholder="Enter your password"
										required
										className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 pr-10"
									/>
									<button
										type="button"
										onClick={() =>
											setShowPassword(!showPassword)
										}
										className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
									>
										{showPassword ? (
											<EyeOff className="h-4 w-4" />
										) : (
											<Eye className="h-4 w-4" />
										)}
									</button>
								</div>
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
										Signing In...
									</div>
								) : (
									<div className="flex items-center">
										<LogIn className="h-4 w-4 mr-2" />
										Sign In
									</div>
								)}
							</Button>
						</form>

						{/* Links */}
						<div className="mt-6 space-y-4">
							<div className="text-center">
								<Link
									href="/forgot-password"
									className="text-purple-400 hover:text-purple-300 text-sm"
								>
									Forgot your password?
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
					<p>© 2025 FAME System. All rights reserved.</p>
				</div>
			</div>
		</div>
	);
}
