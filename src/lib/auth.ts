import bcrypt from "bcryptjs";
import {
	getUserByEmail,
	getUserById,
	updateUser,
	getPendingStageManagers,
} from "./data-access";
import { User, SessionData, UserRole, UserStatus } from "@/types";

// Password hashing utilities
export async function hashPassword(password: string): Promise<string> {
	const saltRounds = 12;
	return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(
	password: string,
	hashedPassword: string
): Promise<boolean> {
	return bcrypt.compare(password, hashedPassword);
}

// User data validation using data access layer
export async function validateUserCredentials(
	email: string,
	password: string
): Promise<User | null> {
	try {
		// Find user by email using data access layer
		const user = await getUserByEmail(email);

		if (!user) {
			console.log(`User not found: ${email}`);
			return null;
		}

		// Verify password
		const isValidPassword = await verifyPassword(
			password,
			user.passwordHash
		);

		if (!isValidPassword) {
			console.log(`Invalid password for user: ${email}`);
			return null;
		}

		// Allow active and pending users to login
		if (user.status !== "active" && user.status !== "pending") {
			console.log(
				`User account not accessible: ${email}, status: ${user.status}`
			);
			return null;
		}

		// Update last login
		user.lastLogin = new Date();
		await updateUser(user);

		return user;
	} catch (error) {
		console.error("Error validating user credentials:", error);
		return null;
	}
}

// Re-export user functions from data access layer for convenience
export { getUserById, getUserByEmail } from "./data-access";

// Check if user has required role
export function hasRequiredRole(
	userRole: UserRole,
	requiredRole: UserRole
): boolean {
	const roleHierarchy: Record<UserRole, number> = {
		super_admin: 4,
		stage_manager: 3,
		dj: 2,
		artist: 1,
	};

	return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

// Create session data from user
export function createSessionData(user: User, eventId?: string): SessionData {
	return {
		userId: user.id,
		email: user.email,
		role: user.role,
		status: user.status,
		eventId,
	};
}

// Validate session data
export function isValidSession(sessionData: any): sessionData is SessionData {
	return Boolean(
		sessionData &&
			typeof sessionData.userId === "string" &&
			typeof sessionData.email === "string" &&
			typeof sessionData.role === "string" &&
			typeof sessionData.status === "string" &&
			["super_admin", "stage_manager", "artist", "dj"].includes(
				sessionData.role
			) &&
			["active", "pending", "suspended", "deactivated"].includes(
				sessionData.status
			)
	);
}
