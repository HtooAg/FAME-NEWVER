// Test script to check /api/auth/me endpoint
// Run this with: node test-auth-me.js

const fetch = require("node-fetch");

async function testAuthMe() {
	try {
		// Test without session cookie (should return 401)
		console.log("Testing /api/auth/me without session...");
		const response1 = await fetch("http://localhost:3000/api/auth/me");
		const result1 = await response1.json();
		console.log("Status:", response1.status);
		console.log("Response:", result1);

		console.log("\n---\n");

		// You would need to get a valid session cookie from a successful login
		// and test with that cookie to see if it works
		console.log(
			"To test with session, first login and get the session cookie"
		);
	} catch (error) {
		console.error("Error testing auth/me:", error);
	}
}

testAuthMe();
