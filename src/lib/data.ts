import { readJsonFile, writeJsonFile, fileExists } from "./gcs";
import { User, Event, Performance, ArtistRegistration } from "@/types";
import { generateId } from "./utils";

// User data operations
export async function getAllUsers(): Promise<User[]> {
	const users = await readJsonFile<User[]>("users/users.json");
	return users || [];
}

export async function saveUser(user: User): Promise<void> {
	const users = await getAllUsers();
	const existingIndex = users.findIndex((u) => u.id === user.id);

	if (existingIndex >= 0) {
		users[existingIndex] = user;
	} else {
		users.push(user);
	}

	await writeJsonFile("users/users.json", users);
}

export async function createUser(
	userData: Omit<User, "id" | "createdAt" | "lastLogin">
): Promise<User> {
	const user: User = {
		...userData,
		id: generateId(),
		createdAt: new Date(),
		lastLogin: new Date(),
	};

	await saveUser(user);
	return user;
}

// Event data operations
export async function getAllEvents(): Promise<Event[]> {
	const events = await readJsonFile<Event[]>("events/events.json");
	return events || [];
}

export async function getEventById(eventId: string): Promise<Event | null> {
	const events = await getAllEvents();
	return events.find((e) => e.id === eventId) || null;
}

export async function saveEvent(event: Event): Promise<void> {
	const events = await getAllEvents();
	const existingIndex = events.findIndex((e) => e.id === event.id);

	if (existingIndex >= 0) {
		events[existingIndex] = event;
	} else {
		events.push(event);
	}

	await writeJsonFile("events/events.json", events);
}

export async function createEvent(
	eventData: Omit<Event, "id" | "registrationUrl">
): Promise<Event> {
	const eventId = generateId();
	const event: Event = {
		...eventData,
		id: eventId,
		registrationUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/register/${eventId}`,
	};

	await saveEvent(event);
	return event;
}

// Performance data operations
export async function getPerformancesByEvent(
	eventId: string
): Promise<Performance[]> {
	const performances = await readJsonFile<Performance[]>(
		`events/${eventId}/performances.json`
	);
	return performances || [];
}

export async function savePerformance(performance: Performance): Promise<void> {
	const performances = await getPerformancesByEvent(performance.eventId);
	const existingIndex = performances.findIndex(
		(p) => p.id === performance.id
	);

	if (existingIndex >= 0) {
		performances[existingIndex] = performance;
	} else {
		performances.push(performance);
	}

	await writeJsonFile(
		`events/${performance.eventId}/performances.json`,
		performances
	);
}

// Artist registration operations
export async function getArtistRegistrations(
	eventId: string
): Promise<ArtistRegistration[]> {
	const registrations = await readJsonFile<ArtistRegistration[]>(
		`events/${eventId}/registrations.json`
	);
	return registrations || [];
}

export async function saveArtistRegistration(
	registration: ArtistRegistration
): Promise<void> {
	const registrations = await getArtistRegistrations(registration.eventId);
	const existingIndex = registrations.findIndex(
		(r) => r.artistId === registration.artistId
	);

	if (existingIndex >= 0) {
		registrations[existingIndex] = registration;
	} else {
		registrations.push(registration);
	}

	await writeJsonFile(
		`events/${registration.eventId}/registrations.json`,
		registrations
	);
}

// Initialize data structure if needed
export async function initializeDataStructure(): Promise<void> {
	try {
		// Check if users file exists, create if not
		const usersExist = await fileExists("users/users.json");
		if (!usersExist) {
			await writeJsonFile("users/users.json", []);
		}

		// Check if events file exists, create if not
		const eventsExist = await fileExists("events/events.json");
		if (!eventsExist) {
			await writeJsonFile("events/events.json", []);
		}

		console.log("Data structure initialized successfully");
	} catch (error) {
		console.error("Error initializing data structure:", error);
		throw error;
	}
}

// Utility function to create default super admin if none exists
export async function ensureSuperAdminExists(): Promise<void> {
	try {
		const users = await getAllUsers();
		const superAdmin = users.find((u) => u.role === "super_admin");

		if (!superAdmin) {
			console.log("No super admin found, creating default super admin");

			// This should be changed in production
			const defaultAdmin: Omit<User, "id" | "createdAt" | "lastLogin"> = {
				email: "admin@fame.com",
				passwordHash: await import("./auth").then((auth) =>
					auth.hashPassword("admin123")
				),
				role: "super_admin",
				status: "active",
				profile: {
					firstName: "Super",
					lastName: "Admin",
				},
			};

			await createUser(defaultAdmin);
			console.log(
				"Default super admin created: admin@fame.com / admin123"
			);
		}
	} catch (error) {
		console.error("Error ensuring super admin exists:", error);
	}
}
