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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Calendar, MapPin, Users, AlertCircle } from "lucide-react";
import { FameLogo } from "@/components/ui/fame-logo";

export default function CreateEventPage() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [formData, setFormData] = useState({
		name: "",
		venue: "",
		date: "",
		description: "",
		maxArtists: "20",
	});

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
		if (error) setError("");
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			const response = await fetch("/api/stage-manager/events", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					...formData,
					maxArtists: parseInt(formData.maxArtists),
				}),
			});

			const result = await response.json();

			if (result.success) {
				router.push(`/stage-manager/events/${result.data.event.id}`);
			} else {
				setError(result.error?.message || "Failed to create event");
			}
		} catch (error) {
			console.error("Create event error:", error);
			setError("Network error. Please try again.");
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
								href="/stage-manager/events"
								className="flex items-center"
							>
								<FameLogo
									width={40}
									height={40}
									className="mr-3"
								/>
								<div>
									<h1 className="text-xl font-semibold text-gray-900">
										Create New Event
									</h1>
									<p className="text-sm text-gray-500">
										Set up a new performance event
									</p>
								</div>
							</Link>
						</div>
						<Link href="/stage-manager/events">
							<Button variant="outline">
								<ArrowLeft className="h-4 w-4 mr-2" />
								Back to Events
							</Button>
						</Link>
					</div>
				</div>
			</header>

			<div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<Card>
					<CardHeader>
						<CardTitle className="text-2xl font-bold text-gray-900">
							Event Details
						</CardTitle>
						<CardDescription>
							Fill in the information for your new event
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-6">
							{/* Error Alert */}
							{error && (
								<Alert className="bg-red-50 border-red-200 text-red-800">
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}

							{/* Event Name */}
							<div className="space-y-2">
								<Label
									htmlFor="name"
									className="text-gray-700 font-medium"
								>
									Event Name *
								</Label>
								<Input
									id="name"
									name="name"
									value={formData.name}
									onChange={handleInputChange}
									placeholder="Enter event name"
									required
									className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
								/>
							</div>

							{/* Venue */}
							<div className="space-y-2">
								<Label
									htmlFor="venue"
									className="text-gray-700 font-medium"
								>
									<MapPin className="h-4 w-4 inline mr-1" />
									Venue *
								</Label>
								<Input
									id="venue"
									name="venue"
									value={formData.venue}
									onChange={handleInputChange}
									placeholder="Enter venue name"
									required
									className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
								/>
							</div>

							{/* Date */}
							<div className="space-y-2">
								<Label
									htmlFor="date"
									className="text-gray-700 font-medium"
								>
									<Calendar className="h-4 w-4 inline mr-1" />
									Event Date *
								</Label>
								<Input
									id="date"
									name="date"
									type="datetime-local"
									value={formData.date}
									onChange={handleInputChange}
									required
									className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
								/>
							</div>

							{/* Max Artists */}
							<div className="space-y-2">
								<Label
									htmlFor="maxArtists"
									className="text-gray-700 font-medium"
								>
									<Users className="h-4 w-4 inline mr-1" />
									Maximum Artists
								</Label>
								<Input
									id="maxArtists"
									name="maxArtists"
									type="number"
									min="1"
									max="100"
									value={formData.maxArtists}
									onChange={handleInputChange}
									className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
								/>
							</div>

							{/* Description */}
							<div className="space-y-2">
								<Label
									htmlFor="description"
									className="text-gray-700 font-medium"
								>
									Description
								</Label>
								<Textarea
									id="description"
									name="description"
									value={formData.description}
									onChange={handleInputChange}
									placeholder="Enter event description (optional)"
									rows={4}
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
											Creating Event...
										</div>
									) : (
										"Create Event"
									)}
								</Button>
								<Link
									href="/stage-manager/events"
									className="flex-1"
								>
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
