"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, User, Mail, Phone, Save } from "lucide-react";
import { FameLogo } from "@/components/ui/fame-logo";

interface UserProfile {
	id: string;
	email: string;
	role: string;
	status: string;
	profile: {
		firstName: string;
		lastName: string;
		phone?: string;
	};
	createdAt: string;
	lastLogin: string;
}

export default function ProfilePage() {
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		email: "",
		phone: "",
	});

	useEffect(() => {
		fetchProfile();
	}, []);

	const fetchProfile = async () => {
		try {
			const response = await fetch("/api/users/profile");
			const data = await response.json();

			if (data.success) {
				setProfile(data.data.user);
				setFormData({
					firstName: data.data.user.profile.firstName,
					lastName: data.data.user.profile.lastName,
					email: data.data.user.email,
					phone: data.data.user.profile.phone || "",
				});
			} else {
				setError(data.error?.message || "Failed to load profile");
			}
		} catch (error) {
			console.error("Profile fetch error:", error);
			setError("Network error occurred. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		setError("");
		setSuccess("");

		try {
			const response = await fetch("/api/users/profile", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			const data = await response.json();

			if (data.success) {
				setProfile(data.data.user);
				setSuccess("Profile updated successfully!");
			} else {
				setError(data.error?.message || "Failed to update profile");
			}
		} catch (error) {
			console.error("Profile update error:", error);
			setError("Network error occurred. Please try again.");
		} finally {
			setSaving(false);
		}
	};

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center p-4">
				<Card className="w-full max-w-md">
					<CardContent className="flex flex-col items-center justify-center p-8">
						<FameLogo width={80} height={80} className="mb-4" />
						<Loader2 className="h-8 w-8 animate-spin text-purple-600" />
						<p className="mt-4 text-gray-600">Loading profile...</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-600 p-4">
			<div className="max-w-2xl mx-auto">
				<Card className="mb-6">
					<CardHeader className="text-center">
						<div className="flex justify-center mb-4">
							<FameLogo width={60} height={60} />
						</div>
						<CardTitle className="text-2xl font-bold">
							Profile Settings
						</CardTitle>
						<CardDescription>
							Manage your account information
						</CardDescription>
					</CardHeader>
				</Card>

				{profile && (
					<div className="grid gap-6">
						{/* Account Information */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<User className="h-5 w-5" />
									Account Information
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label className="text-sm font-medium text-gray-600">
											Role
										</Label>
										<p className="text-lg font-semibold capitalize">
											{profile.role.replace("_", " ")}
										</p>
									</div>
									<div>
										<Label className="text-sm font-medium text-gray-600">
											Status
										</Label>
										<p
											className={`text-lg font-semibold capitalize ${
												profile.status === "active"
													? "text-green-600"
													: profile.status ===
													  "pending"
													? "text-yellow-600"
													: "text-red-600"
											}`}
										>
											{profile.status}
										</p>
									</div>
								</div>
								<div>
									<Label className="text-sm font-medium text-gray-600">
										Member Since
									</Label>
									<p className="text-lg">
										{new Date(
											profile.createdAt
										).toLocaleDateString()}
									</p>
								</div>
							</CardContent>
						</Card>

						{/* Profile Form */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Mail className="h-5 w-5" />
									Personal Information
								</CardTitle>
							</CardHeader>
							<CardContent>
								<form
									onSubmit={handleSubmit}
									className="space-y-4"
								>
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="firstName">
												First Name
											</Label>
											<Input
												id="firstName"
												type="text"
												value={formData.firstName}
												onChange={(e) =>
													handleInputChange(
														"firstName",
														e.target.value
													)
												}
												required
												placeholder="First name"
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="lastName">
												Last Name
											</Label>
											<Input
												id="lastName"
												type="text"
												value={formData.lastName}
												onChange={(e) =>
													handleInputChange(
														"lastName",
														e.target.value
													)
												}
												required
												placeholder="Last name"
											/>
										</div>
									</div>
									<div className="space-y-2">
										<Label htmlFor="email">
											Email Address
										</Label>
										<Input
											id="email"
											type="email"
											value={formData.email}
											onChange={(e) =>
												handleInputChange(
													"email",
													e.target.value
												)
											}
											required
											placeholder="Enter your email"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="phone">
											Phone Number
										</Label>
										<Input
											id="phone"
											type="tel"
											value={formData.phone}
											onChange={(e) =>
												handleInputChange(
													"phone",
													e.target.value
												)
											}
											placeholder="Enter your phone number"
										/>
									</div>

									{error && (
										<Alert variant="destructive">
											<AlertDescription>
												{error}
											</AlertDescription>
										</Alert>
									)}

									{success && (
										<Alert className="border-green-200 bg-green-50">
											<AlertDescription className="text-green-800">
												{success}
											</AlertDescription>
										</Alert>
									)}

									<Button
										type="submit"
										className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
										disabled={saving}
									>
										{saving ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Saving...
											</>
										) : (
											<>
												<Save className="mr-2 h-4 w-4" />
												Save Changes
											</>
										)}
									</Button>
								</form>
							</CardContent>
						</Card>
					</div>
				)}
			</div>
		</div>
	);
}
