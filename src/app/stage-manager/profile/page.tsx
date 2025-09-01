"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, User, Mail, Phone, Save, AlertCircle } from "lucide-react";
import { FameLogo } from "@/components/ui/fame-logo";

export default function ProfilePage() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [formData, setFormData] = useState({
		firstName: "Stage",
		lastName: "Manager",
		email: "stage@fame.dev",
		phone: "",
	});

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
		if (error) setError("");
		if (success) setSuccess("");
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		setSuccess("");

		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));
			setSuccess("Profile updated successfully!");
		} catch (error) {
			console.error("Profile update error:", error);
			setError("Failed to update profile. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white shadow-sm border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<div className="flex items-center">
							<Link
								href="/stage-manager"
								className="flex items-center"
							>
								<FameLogo
									width={40}
									height={40}
									className="mr-3"
								/>
								<div>
									<h1 className="text-xl font-semibold text-gray-900">
										Profile Settings
									</h1>
									<p className="text-sm text-gray-500">
										Manage your account information
									</p>
								</div>
							</Link>
						</div>
						<Link href="/stage-manager">
							<Button variant="outline">
								<ArrowLeft className="h-4 w-4 mr-2" />
								Back to Dashboard
							</Button>
						</Link>
					</div>
				</div>
			</header>

			<div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<Card>
					<CardHeader>
						<CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
							<User className="h-6 w-6 mr-2" />
							Profile Information
						</CardTitle>
						<CardDescription>
							Update your personal information and contact details
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-6">
							{/* Success Alert */}
							{success && (
								<Alert className="bg-green-50 border-green-200 text-green-800">
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>
										{success}
									</AlertDescription>
								</Alert>
							)}

							{/* Error Alert */}
							{error && (
								<Alert className="bg-red-50 border-red-200 text-red-800">
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}

							{/* First Name */}
							<div className="space-y-2">
								<Label
									htmlFor="firstName"
									className="text-gray-700 font-medium"
								>
									First Name
								</Label>
								<Input
									id="firstName"
									name="firstName"
									value={formData.firstName}
									onChange={handleInputChange}
									placeholder="Enter your first name"
									className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
								/>
							</div>

							{/* Last Name */}
							<div className="space-y-2">
								<Label
									htmlFor="lastName"
									className="text-gray-700 font-medium"
								>
									Last Name
								</Label>
								<Input
									id="lastName"
									name="lastName"
									value={formData.lastName}
									onChange={handleInputChange}
									placeholder="Enter your last name"
									className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
								/>
							</div>

							{/* Email */}
							<div className="space-y-2">
								<Label
									htmlFor="email"
									className="text-gray-700 font-medium"
								>
									<Mail className="h-4 w-4 inline mr-1" />
									Email Address
								</Label>
								<Input
									id="email"
									name="email"
									type="email"
									value={formData.email}
									onChange={handleInputChange}
									placeholder="Enter your email"
									className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
								/>
							</div>

							{/* Phone */}
							<div className="space-y-2">
								<Label
									htmlFor="phone"
									className="text-gray-700 font-medium"
								>
									<Phone className="h-4 w-4 inline mr-1" />
									Phone Number
								</Label>
								<Input
									id="phone"
									name="phone"
									type="tel"
									value={formData.phone}
									onChange={handleInputChange}
									placeholder="Enter your phone number"
									className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
								/>
							</div>

							{/* Submit Button */}
							<div className="flex space-x-4">
								<Button
									type="submit"
									disabled={loading}
									className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3"
								>
									{loading ? (
										<div className="flex items-center">
											<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
											Saving...
										</div>
									) : (
										<div className="flex items-center">
											<Save className="h-4 w-4 mr-2" />
											Save Changes
										</div>
									)}
								</Button>
								<Link href="/stage-manager" className="flex-1">
									<Button
										type="button"
										variant="outline"
										className="w-full py-3"
									>
										Cancel
									</Button>
								</Link>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
