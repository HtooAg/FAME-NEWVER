import { readJsonFile, writeJsonFile } from "./gcs";
import { readLocalJsonFile, writeLocalJsonFile } from "./local-storage";
import { User, Event, Performance } from "@/types";

// Check if we should use local storage (development mode)
const isDevelopment = process.env.NODE_ENV === "development";
const useLocalStorage =
	isDevelopment &&
	(!process.env.GOOGLE_CLOUD_PROJECT_ID ||
		!process.env.GOOGLE_CLOUD_KEY_FILE);

// Data access layer that handles both GCS and local storage
class DataAccess {
	private async readJson<T>(filePath: string): Promise<T | null> {
		try {
			if (useLocalStorage) {
				console.log(`[LOCAL] Reading: ${filePath}`);
				return await readLocalJsonFile<T>(filePath);
			} else {
				console.log(`[GCS] Reading: ${filePath}`);
				return await readJsonFile<T>(filePath);
			}
		} catch (error) {
			console.error(`Error reading ${filePath}:`, error);
			return null;
		}
	}

	private async writeJson<T>(filePath: string, data: T): Promise<void> {
		try {
			if (useLocalStorage) {
				console.log(`[LOCAL] Writing: ${filePath}`);
				await writeLocalJsonFile<T>(filePath, data);
			} else {
				console.log(`[GCS] Writing: ${filePath}`);
				await writeJsonFile<T>(filePath, data);
			}
		} catch (error) {
			console.error(`Error writing ${filePath}:`, error);
			throw error;
		}
	}

	// User Management
	async getAllUsers(): Promise<User[]> {
		const users: User[] = [];

		// Read from different user role folders
		const roles = ["super_admin", "stage_manager", "artist", "dj"];

		for (const role of roles) {
			// First try to read a users.json collection file
			const roleUsers = await this.readJson<User[]>(
				`users/${role}/users.json`
			);
			if (roleUsers) {
				users.push(...roleUsers);
				continue;
			}

			// If no collection file, try to read individual user files
			// Based on your bucket structure, try known user files
			const knownUserFiles = [
				"Alice-4.json",
				"John-Doe-3.json",
				"John-1.json",
				"Maung-Maung-5.json",
				"Sayan-2.json",
			];

			for (const fileName of knownUserFiles) {
				const user = await this.readJson<User>(
					`users/${role}/${fileName}`
				);
				if (user) {
					users.push(user);
				}
			}
		}

		return users;
	}

	async getUserById(id: string): Promise<User | null> {
		const users = await this.getAllUsers();
		return users.find((user) => user.id === id) || null;
	}

	async getUserByEmail(email: string): Promise<User | null> {
		// First check in super admin users
		const superAdmins = await this.readJson<User[]>("users/super_admin/users.json");
		if (superAdmins) {
			const superAdmin = superAdmins.find(user => user.email === email);
			if (superAdmin) return superAdmin;
		}

		// Then check in stage managers
		const stageManagers = await this.readJson<User[]>("users/stage_manager/users.json");
		if (stageManagers) {
			const stageManager = stageManagers.find(user => user.email === email);
			if (stageManager) return stageManager;
		}

		return null;
	}

	async createUser(user: User): Promise<void> {
		const rolePath = `users/${user.role}/users.json`;
		const existingUsers = (await this.readJson<User[]>(rolePath)) || [];

		// Check if user already exists
		const userExists = existingUsers.some((u) => u.email === user.email);
		if (userExists) {
			throw new Error("User with this email already exists");
		}

		existingUsers.push(user);
		await this.writeJson(rolePath, existingUsers);
	}

	async updateUser(user: User): Promise<void> {
		const rolePath = `users/${user.role}/users.json`;
		const existingUsers = (await this.readJson<User[]>(rolePath)) || [];

		const userIndex = existingUsers.findIndex((u) => u.id === user.id);
		if (userIndex === -1) {
			throw new Error("User not found");
		}

		existingUsers[userIndex] = user;
		await this.writeJson(rolePath, existingUsers);
	}

	async deleteUser(userId: string): Promise<void> {
		const user = await this.getUserById(userId);
		if (!user) {
			throw new Error("User not found");
		}

		const rolePath = `users/${user.role}/users.json`;
		const existingUsers = (await this.readJson<User[]>(rolePath)) || [];

		const filteredUsers = existingUsers.filter((u) => u.id !== userId);
		await this.writeJson(rolePath, filteredUsers);
	}

	// Stage Manager Registration Management
	async getPendingStageManagers(): Promise<User[]> {
		const registrations =
			(await this.readJson<User[]>(
				"registrations/stage-managers/pending.json"
			)) || [];
		return registrations;
	}

	async addPendingStageManager(user: User): Promise<void> {
		const registrations =
			(await this.readJson<User[]>(
				"registrations/stage-managers/pending.json"
			)) || [];
		registrations.push(user);
		await this.writeJson(
			"registrations/stage-managers/pending.json",
			registrations
		);
	}

	async approvePendingStageManager(userId: string): Promise<void> {
		// Get pending registrations
		const pending =
			(await this.readJson<User[]>(
				"registrations/stage-managers/pending.json"
			)) || [];
		const userIndex = pending.findIndex((u) => u.id === userId);

		if (userIndex === -1) {
			throw new Error("Pending registration not found");
		}

		const user = pending[userIndex];
		user.status = "active";

		// Move to active users
		await this.createUser(user);

		// Remove from pending
		pending.splice(userIndex, 1);
		await this.writeJson(
			"registrations/stage-managers/pending.json",
			pending
		);
	}

	async rejectPendingStageManager(userId: string): Promise<void> {
		const pending =
			(await this.readJson<User[]>(
				"registrations/stage-managers/pending.json"
			)) || [];
		const filteredPending = pending.filter((u) => u.id !== userId);
		await this.writeJson(
			"registrations/stage-managers/pending.json",
			filteredPending
		);
	}

	// Event Management
	async getAllEvents(): Promise<Event[]> {
		return (await this.readJson<Event[]>("events/events.json")) || [];
	}

	async getEventById(eventId: string): Promise<Event | null> {
		const events = await this.getAllEvents();
		return events.find((event) => event.id === eventId) || null;
	}

	async createEvent(event: Event): Promise<void> {
		const events = await this.getAllEvents();
		events.push(event);
		await this.writeJson("events/events.json", events);
	}

	async updateEvent(event: Event): Promise<void> {
		const events = await this.getAllEvents();
		const eventIndex = events.findIndex((e) => e.id === event.id);

		if (eventIndex === -1) {
			throw new Error("Event not found");
		}

		events[eventIndex] = event;
		await this.writeJson("events/events.json", events);
	}

	async deleteEvent(eventId: string): Promise<void> {
		const events = await this.getAllEvents();
		const filteredEvents = events.filter((e) => e.id !== eventId);
		await this.writeJson("events/events.json", filteredEvents);
	}

	// Performance Management
	async getPerformancesByEvent(eventId: string): Promise<Performance[]> {
		return (
			(await this.readJson<Performance[]>(
				`events/${eventId}/performances.json`
			)) || []
		);
	}

	async createPerformance(performance: Performance): Promise<void> {
		const performances = await this.getPerformancesByEvent(
			performance.eventId
		);
		performances.push(performance);
		await this.writeJson(
			`events/${performance.eventId}/performances.json`,
			performances
		);
	}

	async updatePerformance(performance: Performance): Promise<void> {
		const performances = await this.getPerformancesByEvent(
			performance.eventId
		);
		const performanceIndex = performances.findIndex(
			(p) => p.id === performance.id
		);

		if (performanceIndex === -1) {
			throw new Error("Performance not found");
		}

		performances[performanceIndex] = performance;
		await this.writeJson(
			`events/${performance.eventId}/performances.json`,
			performances
		);
	}

	// Counter Management (for generating unique IDs)
	async getNextCounter(counterName: string): Promise<number> {
		const counters =
			(await this.readJson<Record<string, number>>(
				"counters/counters.json"
			)) || {};
		const currentValue = counters[counterName] || 0;
		const nextValue = currentValue + 1;

		counters[counterName] = nextValue;
		await this.writeJson("counters/counters.json", counters);

		return nextValue;
	}

	// Notification Management
	async getNotifications(userId: string): Promise<any[]> {
		return (
			(await this.readJson<any[]>(`notifications/${userId}.json`)) || []
		);
	}

	async addNotification(userId: string, notification: any): Promise<void> {
		const notifications = await this.getNotifications(userId);
		notifications.push({
			...notification,
			id: await this.getNextCounter("notifications"),
			createdAt: new Date(),
			read: false,
		});
		await this.writeJson(`notifications/${userId}.json`, notifications);
	}

	// Test data management
	async createTestData(): Promise<void> {
		const testData = {
			message: "Test data created successfully",
			timestamp: new Date(),
			environment: process.env.NODE_ENV,
		};

		await this.writeJson("test/test-data.json", testData);
	}
}

// Export singleton instance
export const dataAccess = new DataAccess();

// Export individual functions for convenience - properly bound to the instance
export const getAllUsers = () => dataAccess.getAllUsers();
export const getUserById = (id: string) => dataAccess.getUserById(id);
export const getUserByEmail = (email: string) =>
	dataAccess.getUserByEmail(email);
export const createUser = (user: User) => dataAccess.createUser(user);
export const updateUser = (user: User) => dataAccess.updateUser(user);
export const deleteUser = (userId: string) => dataAccess.deleteUser(userId);
export const getPendingStageManagers = () =>
	dataAccess.getPendingStageManagers();
export const addPendingStageManager = (user: User) =>
	dataAccess.addPendingStageManager(user);
export const approvePendingStageManager = (userId: string) =>
	dataAccess.approvePendingStageManager(userId);
export const rejectPendingStageManager = (userId: string) =>
	dataAccess.rejectPendingStageManager(userId);
export const getAllEvents = () => dataAccess.getAllEvents();
export const getEventById = (eventId: string) =>
	dataAccess.getEventById(eventId);
export const createEvent = (event: Event) => dataAccess.createEvent(event);
export const updateEvent = (event: Event) => dataAccess.updateEvent(event);
export const deleteEvent = (eventId: string) => dataAccess.deleteEvent(eventId);
export const getPerformancesByEvent = (eventId: string) =>
	dataAccess.getPerformancesByEvent(eventId);
export const createPerformance = (performance: Performance) =>
	dataAccess.createPerformance(performance);
export const updatePerformance = (performance: Performance) =>
	dataAccess.updatePerformance(performance);
export const getNextCounter = (counterName: string) =>
	dataAccess.getNextCounter(counterName);
export const getNotifications = (userId: string) =>
	dataAccess.getNotifications(userId);
export const addNotification = (userId: string, notification: any) =>
	dataAccess.addNotification(userId, notification);
export const createTestData = () => dataAccess.createTestData();
