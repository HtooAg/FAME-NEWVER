import { NextRequest } from "next/server";
import { POST } from "../login/route";

// Mock the auth and session modules
jest.mock("@/lib/auth", () => ({
	validateUserCredentials: jest.fn(),
	createSessionData: jest.fn(),
}));

jest.mock("@/lib/session", () => ({
	createSessionResponse: jest.fn(),
}));

jest.mock("@/lib/utils", () => ({
	isValidEmail: jest.fn(),
}));

describe("/api/auth/login", () => {
	const mockValidateUserCredentials =
		require("@/lib/auth").validateUserCredentials;
	const mockCreateSessionData = require("@/lib/auth").createSessionData;
	const mockCreateSessionResponse =
		require("@/lib/session").createSessionResponse;
	const mockIsValidEmail = require("@/lib/utils").isValidEmail;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should return error for missing credentials", async () => {
		const request = new NextRequest(
			"http://localhost:3000/api/auth/login",
			{
				method: "POST",
				body: JSON.stringify({}),
			}
		);

		const response = await POST(request);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.success).toBe(false);
		expect(data.error.code).toBe("MISSING_CREDENTIALS");
	});

	it("should return error for invalid email", async () => {
		mockIsValidEmail.mockReturnValue(false);

		const request = new NextRequest(
			"http://localhost:3000/api/auth/login",
			{
				method: "POST",
				body: JSON.stringify({
					email: "invalid-email",
					password: "password123",
				}),
			}
		);

		const response = await POST(request);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.success).toBe(false);
		expect(data.error.code).toBe("INVALID_EMAIL");
	});

	it("should return error for invalid credentials", async () => {
		mockIsValidEmail.mockReturnValue(true);
		mockValidateUserCredentials.mockResolvedValue(null);

		const request = new NextRequest(
			"http://localhost:3000/api/auth/login",
			{
				method: "POST",
				body: JSON.stringify({
					email: "test@example.com",
					password: "wrongpassword",
				}),
			}
		);

		const response = await POST(request);
		const data = await response.json();

		expect(response.status).toBe(401);
		expect(data.success).toBe(false);
		expect(data.error.code).toBe("INVALID_CREDENTIALS");
	});

	it("should return error for suspended account", async () => {
		mockIsValidEmail.mockReturnValue(true);
		mockValidateUserCredentials.mockResolvedValue({
			id: "user1",
			email: "test@example.com",
			role: "stage_manager",
			status: "suspended",
			profile: { firstName: "Test", lastName: "User" },
		});

		const request = new NextRequest(
			"http://localhost:3000/api/auth/login",
			{
				method: "POST",
				body: JSON.stringify({
					email: "test@example.com",
					password: "password123",
				}),
			}
		);

		const response = await POST(request);
		const data = await response.json();

		expect(response.status).toBe(403);
		expect(data.success).toBe(false);
		expect(data.error.code).toBe("ACCOUNT_SUSPENDED");
	});

	it("should successfully login active user", async () => {
		const mockUser = {
			id: "user1",
			email: "test@example.com",
			role: "stage_manager",
			status: "active",
			profile: { firstName: "Test", lastName: "User" },
		};

		const mockSessionData = {
			userId: "user1",
			email: "test@example.com",
			role: "stage_manager",
			status: "active",
		};

		mockIsValidEmail.mockReturnValue(true);
		mockValidateUserCredentials.mockResolvedValue(mockUser);
		mockCreateSessionData.mockReturnValue(mockSessionData);
		mockCreateSessionResponse.mockImplementation(
			(sessionData, response) => response
		);

		const request = new NextRequest(
			"http://localhost:3000/api/auth/login",
			{
				method: "POST",
				body: JSON.stringify({
					email: "test@example.com",
					password: "password123",
				}),
			}
		);

		const response = await POST(request);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.data.user.email).toBe("test@example.com");
		expect(data.data.redirectUrl).toBe("/stage-manager");
		expect(mockCreateSessionResponse).toHaveBeenCalledWith(
			mockSessionData,
			expect.any(Object)
		);
	});
});
