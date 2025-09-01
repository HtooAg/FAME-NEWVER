"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import {
	ArrowLeft,
	Calendar,
	MapPin,
	Users,
	AlertCircle,
	Save,
} from "lucide-react";
import { FameLogo } from "@/components/ui/fame-logo";

interface Event {
	id: string;
	name: string;
	venue: string;
	date: string;
	description: string;
	settings: {
		maxArtists: number;
	};
}

export default function EditEventPage() {
	const params = useParams();
	const router = useRouter();
	const eventId = params.eventId as string;
	const [event, setEvent] = useState<Event | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [formData, setFormData] = useState({
		name: "",
		venue: "",
		date: "",
		description: "",
		maxArtists: "20",
	});

	useEffect(() => {
		if (eventId) {
			fetchEvent();
		}
	}, [eventId]);

	const fetchEvent = async () => {
		try {
			const response = await fetch(
				`/api/stage-manager/events/${eventId}`
			);
			if (response.ok) {
				const result = await response.json();
				if (result.success) {
					const eventData = result.data.event;
					setEvent(eventData);
					setFormData({
						name: eventData.name,
						venue: eventData.venue,
						date: new Date(eventData.date)
							.toISOString()
							.slice(0, 16),
						description: eventData.description || "",
						maxArtists:
							eventData.settings?.maxArtists?.toString() || "20",
					});
				}
			} else if (response.status === 403) {
				router.push("/login");
			} else if (response.status === 404) {
				router.push("/stage-manager/events");
			}
		} catch (error) {
			console.error("Error fetching event:", error);
		} finally {
			setLoading(false);
		}
	};

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
		setSaving(true);
		setError("");

		try {
			const response = await fetch(
				`/api/stage-manager/events/${eventId}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						...formData,
						settings: {
							...event?.settings,
							maxArtists: parseInt(formData.maxArtists),
						},
					}),
				}
			);

			const result = await response.json();

			if (result.success) {
				router.push(`/stage-manager/events/${eventId}`);
			} else {
				setError(result.error?.message || "Failed to update event");
			}
		} catch (error) {
			console.error("Update event error:", error);
			setError("Network error. Please try again.");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading event...</p>
				</div>
			</div>
		);
	}

	if (!event) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<h2 className="text-2xl font-bold text-gray-900 mb-4">
						Event Not Found
					</h2>
					<Link href="/stage-manager/events">
						<Button>Back to Events</Button>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white shadow-sm border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<div className="flex items-center">
							<Link
								href={`/stage-manager/events/${eventId}`}
								className="flex items-center"
							>
								<FameLogo
									width={40}
									height={40}
									className="mr-3"
								/>
								<div>
									<h1 className="text-xl font-semibold text-gray-900">
										Edit Event
									</h1>
									<p className="text-sm text-gray-500">
										{event.name}
									</p>
								</div>
							</Link>
						</div>
						<Link href={`/stage-manager/events/${eventId}`}>
							<Button variant="outline">
								<ArrowLeft className="h-4 w-4 mr-2" />
								Back to Event
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
							Update the information for your event
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
									disabled={saving}
									className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3"
								>
									{saving ? (
										<div className="flex items-center">
											<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
											Saving Changes...
										</div>
									) : (
										<div className="flex items-center">
											<Save className="h-4 w-4 mr-2" />
											Save Changes
										</div>
									)}
								</Button>
								<Link
									href={`/stage-manager/events/${eventId}`}
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
