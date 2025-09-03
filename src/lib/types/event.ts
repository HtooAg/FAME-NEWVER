export interface Event {
	id: string;
	name: string;
	venueName: string;
	status: "draft" | "active" | "completed" | "cancelled";
	startDate: string;
	endDate: string;
	description: string;
	showDates?: string[];
	createdAt: string;
	updatedAt: string;
}

export interface Artist {
	id: string;
	artistName: string;
	realName: string;
	style: string;
	performanceDuration: number;
	status: "pending" | "approved" | "rejected";
	eventId: string;
}

export interface ShowOrderItem {
	id: string;
	artistId: string;
	artist: Artist;
	position: number;
	startTime: string;
	endTime: string;
	notes: string;
	setupTime: number;
	breakTime: number;
}

export interface ShowOrder {
	id: string;
	eventId: string;
	eventName: string;
	showDate: string;
	startTime: string;
	totalDuration: number;
	items: ShowOrderItem[];
	status: "draft" | "published" | "active" | "completed";
	createdAt: string;
	updatedAt: string;
}
