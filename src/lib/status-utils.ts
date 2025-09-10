// Status Color and Display Utilities
// Provides consistent status colors and ordering across all pages

export type ArtistStatus =
	| "not_started"
	| "next_on_deck"
	| "next_on_stage"
	| "currently_on_stage"
	| "completed";

export const STATUS_COLORS = {
	not_started: "bg-white border-gray-300 text-gray-900",
	next_on_deck: "bg-white border-blue-300 text-blue-900",
	next_on_stage: "bg-white border-yellow-300 text-yellow-900",
	currently_on_stage: "bg-white border-green-300 text-green-900",
	completed: "bg-white border-red-300 text-red-900",
} as const;

export const STATUS_LABELS = {
	not_started: "Not Started",
	next_on_deck: "Next On Deck",
	next_on_stage: "Next On Stage",
	currently_on_stage: "Currently On Stage",
	completed: "Completed",
} as const;

export const STATUS_ORDER = {
	not_started: 1,
	next_on_deck: 2,
	next_on_stage: 3,
	currently_on_stage: 4,
	completed: 5,
} as const;

export function getStatusColorClasses(status?: string | null): string {
	if (!status || !(status in STATUS_COLORS)) {
		return STATUS_COLORS.not_started;
	}
	return STATUS_COLORS[status as ArtistStatus];
}

export function getStatusLabel(status?: string | null): string {
	if (!status || !(status in STATUS_LABELS)) {
		return STATUS_LABELS.not_started;
	}
	return STATUS_LABELS[status as ArtistStatus];
}

export function getStatusOrder(status?: string | null): number {
	if (!status || !(status in STATUS_ORDER)) {
		return STATUS_ORDER.not_started;
	}
	return STATUS_ORDER[status as ArtistStatus];
}

export function sortByStatus<T extends { status?: string | null }>(
	items: T[]
): T[] {
	return [...items].sort((a, b) => {
		const orderA = getStatusOrder(a.status);
		const orderB = getStatusOrder(b.status);
		return orderA - orderB;
	});
}

// Badge variant mapping for UI components
export function getStatusBadgeVariant(
	status?: string | null
): "default" | "secondary" | "destructive" | "outline" {
	switch (status) {
		case "completed":
			return "destructive";
		case "currently_on_stage":
			return "default";
		case "next_on_stage":
		case "next_on_deck":
			return "secondary";
		default:
			return "outline";
	}
}
