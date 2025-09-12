"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { User, Mail } from "lucide-react";
import Image from "next/image";

export default function ArtistLogin() {
	const router = useRouter();
	const { toast } = useToast();
	const [loading, setLoading] = useState(false);
	const [checkingSession, setCheckingSession] = useState(true);
	const [formData, setFormData] = useState({
		email: "",
		artistName: "",
		artistId: "",
	});

	// Check if user is already logged in and pre-fill form from URL params
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

		// Pre-fill form from URL parameters
		const urlParams = new URLSearchParams(window.location.search);
		const artistId = urlParams.get("artistId");
		const artistName = urlParams.get("artistName");
		const email = urlParams.get("email");

		if (artistId || artistName || email) {
			setFormData({
				email: email || "",
				artistName: artistName || "",
				artistId: artistId || "",
			});
		}

		checkSession();
	}, [router]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			// Validate artist credentials
			const response = await fetch(`/api/artists/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email: formData.email,
					artistName: formData.artistName,
					artistId: formData.artistId,
				}),
			});

			if (response.ok) {
				const data = await response.json();
				console.log("Login API response:", data); // Debug log

				// Check if we have the basic required artist data
				if (data.success && data.data && data.data.artist) {
					const artist = data.data.artist;
					console.log("Artist data:", artist); // Debug log

					// Validate that we have the minimum required fields
					if (
						artist.id &&
						(artist.artistName || artist.artist_name)
					) {
						// Store artist session
						localStorage.setItem(
							"artistSession",
							JSON.stringify(artist)
						);

						console.log(
							"Login Successful - Redirecting to dashboard..."
						);

						// Redirect to artist dashboard with artist ID
						router.push(`/artist-dashboard/${artist.id}`);
					} else {
						console.error("Missing required fields:", {
							id: artist.id,
							artistName: artist.artistName,
							artist_name: artist.artist_name,
						});
						throw new Error(
							"Artist data is incomplete. Missing ID or name."
						);
					}
				} else {
					console.error("Invalid response structure:", data);
					throw new Error("Invalid response from server");
				}
			} else {
				const errorData = await response.json();
				console.error("Login API error:", errorData);
				throw new Error(
					errorData.error?.message ||
						errorData.message ||
						"Artist not found"
				);
			}
		} catch (error) {
			console.error("Login error:", error);
			const errorMessage =
				error instanceof Error
					? error.message
					: formData.artistId && formData.artistId.trim() !== ""
					? "Artist not found. Please check that your Artist ID, email, and artist name all match your registration."
					: "Artist not found. Please check your email and artist name.";

			toast({
				title: "Login Failed",
				description: errorMessage,
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	// Show loading while checking session
	if (checkingSession) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Checking session...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center">
						<Image
							src="/fame-logo.png"
							alt="FAME Logo"
							width={80}
							height={80}
							className="object-contain"
						/>
					</div>
					<CardTitle className="text-2xl font-bold">
						Artist Login
					</CardTitle>
					<p className="text-muted-foreground">
						Access your artist dashboard and manage your profile
					</p>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="artistId">Artist ID</Label>
							<div className="relative">
								<User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
								<Input
									id="artistId"
									placeholder="Enter your artist ID for secure login"
									value={formData.artistId}
									onChange={(e) =>
										setFormData({
											...formData,
											artistId: e.target.value,
										})
									}
									className="pl-10"
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">Email Address</Label>
							<div className="relative">
								<Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
								<Input
									id="email"
									type="email"
									placeholder="Enter your email"
									value={formData.email}
									onChange={(e) =>
										setFormData({
											...formData,
											email: e.target.value,
										})
									}
									className="pl-10"
									required
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="artistName">
								Artist/Stage Name
							</Label>
							<div className="relative">
								<User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
								<Input
									id="artistName"
									placeholder="Enter your artist name"
									value={formData.artistName}
									onChange={(e) =>
										setFormData({
											...formData,
											artistName: e.target.value,
										})
									}
									className="pl-10"
									required
								/>
							</div>
						</div>
						<Button
							type="submit"
							className="w-full"
							disabled={loading}
						>
							{loading ? "Signing In..." : "Sign In"}
						</Button>
					</form>
				</CardContent>
			</Card>
			<Toaster />
		</div>
	);
}
