// Show Timing Calculation Utilities
// Prioritizes actual_duration from uploaded music tracks over performance_duration

interface Artist {
	id: string;
	artist_name: string;
	performance_duration: number;
	actual_duration?: number; // in seconds from uploaded music
}

interface Cue {
	id: string;
	title: string;
	duration?: number; // in minutes
}

interface ShowOrderItem {
	id: string;
	type: "artist" | "cue";
	artist?: Artist;
	cue?: Cue;
	performance_order: number;
}

interface TimingCalculation {
	startTime: string;
	endTime: string;
	duration: number; // in minutes for display
	actualDurationSeconds: number; // for calculations
}

export function calculateTotalShowTime(items: ShowOrderItem[]): number {
	// Calculate total in seconds first for accuracy
	const totalSeconds = items.reduce((total, item) => {
		if (item.type === "artist" && item.artist) {
			// Use actual duration if available, otherwise fall back to performance duration
			const durationSeconds = item.artist.actual_duration
				? item.artist.actual_duration // Already in seconds
				: (item.artist.performance_duration || 0) * 60; // Convert minutes to seconds
			return total + durationSeconds;
		} else if (item.type === "cue" && item.cue) {
			return total + (item.cue.duration || 0) * 60; // Convert minutes to seconds
		}
		return total;
	}, 0);

	// Return total seconds for more accurate calculations
	return totalSeconds;
}

export function formatTotalTime(totalSeconds: number): string {
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	if (hours > 0) {
		return `${hours}h ${minutes}m ${seconds}s`;
	} else if (minutes > 0) {
		return `${minutes}m ${seconds}s`;
	} else {
		return `${seconds}s`;
	}
}

export function formatTime(minutes: number): string {
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

export function calculateItemTiming(
	items: ShowOrderItem[],
	index: number,
	showStartTime?: string
): TimingCalculation {
	if (!showStartTime) {
		return {
			startTime: "",
			endTime: "",
			duration: 0,
			actualDurationSeconds: 0,
		};
	}

	const [hours, minutes] = showStartTime.split(":").map(Number);
	let currentTime = hours * 60 + minutes;

	// Calculate start time for this item
	for (let i = 0; i < index; i++) {
		const item = items[i];
		if (item.type === "artist" && item.artist) {
			// Use actual duration if available, otherwise fall back to performance duration
			const duration = item.artist.actual_duration
				? Math.ceil(item.artist.actual_duration / 60) // Convert seconds to minutes
				: item.artist.performance_duration || 0;
			currentTime += duration;
		} else if (item.type === "cue" && item.cue) {
			currentTime += item.cue.duration || 0;
		}
	}

	const startTime = currentTime;
	const item = items[index];
	let duration = 0;
	let actualDurationSeconds = 0;

	if (item.type === "artist" && item.artist) {
		// Use actual duration if available, otherwise fall back to performance duration
		if (item.artist.actual_duration) {
			actualDurationSeconds = item.artist.actual_duration;
			duration = Math.ceil(item.artist.actual_duration / 60); // Convert seconds to minutes
		} else {
			duration = item.artist.performance_duration || 0;
			actualDurationSeconds = duration * 60; // Convert minutes to seconds
		}
	} else if (item.type === "cue" && item.cue) {
		duration = item.cue.duration || 0;
		actualDurationSeconds = duration * 60; // Convert minutes to seconds
	}

	const endTime = startTime + duration;

	const formatMinutesToTime = (mins: number) => {
		const h = Math.floor(mins / 60);
		const m = mins % 60;
		return `${h.toString().padStart(2, "0")}:${m
			.toString()
			.padStart(2, "0")}`;
	};

	return {
		startTime: formatMinutesToTime(startTime),
		endTime: formatMinutesToTime(endTime),
		duration,
		actualDurationSeconds,
	};
}

export function formatDuration(seconds: number | null): string {
	if (!seconds) return "N/A";
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function getDisplayDuration(artist: Artist): string {
	if (artist.actual_duration) {
		return formatDuration(artist.actual_duration);
	}
	return `${artist.performance_duration} min`;
}

export function getDurationInMinutes(artist: Artist): number {
	if (artist.actual_duration) {
		return Math.ceil(artist.actual_duration / 60);
	}
	return artist.performance_duration || 0;
}
