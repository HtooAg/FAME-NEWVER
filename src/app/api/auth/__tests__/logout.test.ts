import { NextRequest } from "next/server";
import { POST, GET } from "../logout/route";

// Mock the session module
jest.mock("@/lib/session", () => ({
	destroySessionResponse: jest.fn(),
}));

describe("/api/auth/logout", () => {
	const mockDestroySessionResponse =
		require("@/lib/session").destroySessionResponse;

	beforeEach(() => {
		jest.clearAllMocks();
		mockDestroySessionResponse.mockImplementation((response) => response);
	});

	it("should successfully logout via POST", async () => {
		const request = new NextRequest(
			"http://localhost:3000/api/auth/logout",
			{
				method: "POST",
			}
		);

		const response = await POST(request);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.data.message).toBe("Successfully logged out");
		expect(data.data.redirectUrl).toBe("/login");
		expect(mockDestroySessionResponse).toHaveBeenCalled();
	});

	it("should successfully logout via GET", async () => {
		const request = new NextRequest(
			"http://localhost:3000/api/auth/logout",
			{
				method: "GET",
			}
		);

		const response = await GET(request);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.data.message).toBe("Successfully logged out");
		expect(mockDestroySessionResponse).toHaveBeenCalled();
	});
});
