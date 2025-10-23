"use client";

import { useState, useEffect } from "react";
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
import { Eye, EyeOff, UserPlus, AlertCircle, CheckCircle } from "lucide-react";

export default function RegisterPage() {
	const router = useRouter();
	const [formData, setFormData] = useState({
		email: "",
		password: "",
		confirmPassword: "",
		firstName: "",
		lastName: "",
		phone: "",
	});
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);
	const [checkingSession, setCheckingSession] = useState(true);

	// Check if user is already logged in
	useEffect(() => {
		const checkSession = async () => {
			try {
				const response = await fetch("/api/auth/me");
				if (response.ok) {
					const result = await response.json();
					if (result.success && result.data) {
						// User is already logged in, redirect based on role
						const { role, status } = result.data;

						if (status === "pending") {
							router.push("/stage-manager-pending");
						} else if (role === "super_admin") {
							router.push("/super-admin");
						} else if (role === "stage_manager") {
							router.push("/stage-manager");
						} else if (role === "artist") {
							router.push("/artist-dashboard");
						} else if (role === "dj") {
							router.push("/dj");
						} else {
							router.push("/");
						}
						return;
					}
				}
			} catch (error) {
				console.log("No active session found");
			} finally {
				setCheckingSession(false);
			}
		};

		checkSession();
	}, [router]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
		// Clear error when user starts typing
		if (error) setError("");
	};

	const validateForm = () => {
		if (
			!formData.email ||
			!formData.password ||
			!formData.firstName ||
			!formData.lastName
		) {
			setError("Please fill in all required fields");
			return false;
		}

		if (formData.password !== formData.confirmPassword) {
			setError("Passwords do not match");
			return false;
		}

		if (formData.password.length < 8) {
			setError("Password must be at least 8 characters long");
			return false;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(formData.email)) {
			setError("Please enter a valid email address");
			return false;
		}

		return true;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		setLoading(true);
		setError("");

		try {
			const response = await fetch("/api/auth/register", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email: formData.email,
					password: formData.password,
					firstName: formData.firstName,
					lastName: formData.lastName,
					phone: formData.phone || undefined,
				}),
			});

			const result = await response.json();

			if (result.success) {
				setSuccess(true);
				// Redirect to login after 3 seconds
				setTimeout(() => {
					router.push("/login");
				}, 3000);
			} else {
				setError(result.error?.message || "Registration failed");
			}
		} catch (error) {
			console.error("Registration error:", error);
			setError("Network error. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	// Show loading while checking session
	if (checkingSession) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-purple-900 to-pink-900 text-white flex items-center justify-center p-4">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
					<p className="text-gray-400">Checking session...</p>
				</div>
			</div>
		);
	}

	if (success) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-purple-900 to-pink-900 text-white flex items-center justify-center p-4">
				<div className="w-full max-w-md text-center space-y-6">
					<div className="flex justify-center mb-6">
						<FameLogo width={80} height={80} />
					</div>
					<Card className="bg-purple-300/50 border-purple-600">
						<CardContent className="p-8">
							<div className="text-center space-y-4">
								<CheckCircle className="h-16 w-16 text-green-400 mx-auto" />
								<h2 className="text-2xl font-bold text-white">
									Registration Successful!
								</h2>
								<p className="text-gray-400">
									Your Stage Manager account has been created
									successfully.
									<span className="block mt-2 text-yellow-400">
										Your account is pending approval. You'll
										receive a notification once approved by
										an administrator.
									</span>
								</p>
								<p className="text-sm text-gray-500">
									Redirecting to login page...
								</p>
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
						Join FAME
					</h1>
					<p className="text-gray-400 text-lg">
						Create your account to get started
					</p>
				</div>

				{/* Registration Form */}
				<Card className="bg-purple-800/50 border-purple-600">
					<CardHeader>
						<CardTitle className="text-white text-center">
							Create Account
						</CardTitle>
						<CardDescription className="text-gray-400 text-center">
							Fill in your details to register
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							{/* Error Alert */}
							{error && (
								<Alert className="bg-red-900/20 border-red-800 text-red-400">
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}

							{/* Name Fields */}
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label
										htmlFor="firstName"
										className="text-gray-300"
									>
										First Name *
									</Label>
									<Input
										id="firstName"
										name="firstName"
										type="text"
										value={formData.firstName}
										onChange={handleInputChange}
										placeholder="First name"
										required
										className="bg-gray-30000 border-gray-700 placeholder-white focus:border-purple-500 focus:ring-purple-500"
									/>
								</div>
								<div className="space-y-2">
									<Label
										htmlFor="lastName"
										className="text-gray-300"
									>
										Last Name *
									</Label>
									<Input
										id="lastName"
										name="lastName"
										type="text"
										value={formData.lastName}
										onChange={handleInputChange}
										placeholder="Last name"
										required
										className="bg-gray-300 border-gray-700 placeholder-white focus:border-purple-500 focus:ring-purple-500"
									/>
								</div>
							</div>

							{/* Email Field */}
							<div className="space-y-2">
								<Label
									htmlFor="email"
									className="text-gray-300"
								>
									Email Address *
								</Label>
								<Input
									id="email"
									name="email"
									type="email"
									value={formData.email}
									onChange={handleInputChange}
									placeholder="Enter your email"
									required
									className="bg-gray-300 border-gray-700 placeholder-white focus:border-purple-500 focus:ring-purple-500"
								/>
							</div>

							{/* Phone Field */}
							<div className="space-y-2">
								<Label
									htmlFor="phone"
									className="text-gray-300"
								>
									Phone Number
								</Label>
								<Input
									id="phone"
									name="phone"
									type="tel"
									value={formData.phone}
									onChange={handleInputChange}
									placeholder="(Optional)"
									className="bg-gray-300 border-gray-700 placeholder-white focus:border-purple-500 focus:ring-purple-500"
								/>
							</div>

							{/* Password Fields */}
							<div className="space-y-2">
								<Label
									htmlFor="password"
									className="text-gray-300"
								>
									Password *
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
										placeholder="At least 8 characters"
										required
										className="bg-gray-300 border-gray-700 placeholder-white focus:border-purple-500 focus:ring-purple-500 pr-10"
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

							<div className="space-y-2">
								<Label
									htmlFor="confirmPassword"
									className="text-gray-300"
								>
									Confirm Password *
								</Label>
								<div className="relative">
									<Input
										id="confirmPassword"
										name="confirmPassword"
										type={
											showConfirmPassword
												? "text"
												: "password"
										}
										value={formData.confirmPassword}
										onChange={handleInputChange}
										placeholder="Confirm your password"
										required
										className="bg-gray-300 border-gray-700 placeholder-white focus:border-purple-500 focus:ring-purple-500 pr-10"
									/>
									<button
										type="button"
										onClick={() =>
											setShowConfirmPassword(
												!showConfirmPassword
											)
										}
										className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
									>
										{showConfirmPassword ? (
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
								className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3 mt-6"
							>
								{loading ? (
									<div className="flex items-center">
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
										Creating Account...
									</div>
								) : (
									<div className="flex items-center">
										<UserPlus className="h-4 w-4 mr-2" />
										Create Account
									</div>
								)}
							</Button>
						</form>

						{/* Links */}
						<div className="mt-6 text-center text-gray-400">
							Already have an account?{" "}
							<Link
								href="/login"
								className="text-purple-400 hover:text-purple-300 font-medium"
							>
								Sign in here
							</Link>
						</div>
					</CardContent>
				</Card>

				{/* Footer */}
				<div className="text-center text-gray-300 text-sm">
					<p>(c) 2025 FAME System. All rights reserved.</p>
				</div>
			</div>
		</div>
	);
}
