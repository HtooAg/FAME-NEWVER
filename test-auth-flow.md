# Test Authentication Flow

## Quick Test Steps

### 1. Test Registration

```bash
# Test the registration endpoint
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.manager@example.com",
    "password": "testpassword123",
    "firstName": "Test",
    "lastName": "Manager",
    "phone": "1234567890"
  }'
```

Expected Response:

```json
{
	"success": true,
	"data": {
		"message": "Stage Manager account created successfully. Your account is pending approval.",
		"user": {
			"id": "user-...",
			"email": "test.manager@example.com",
			"role": "stage_manager",
			"status": "pending",
			"profile": {
				"firstName": "Test",
				"lastName": "Manager",
				"phone": "1234567890"
			}
		}
	}
}
```

### 2. Test Login with Pending User

```bash
# Test login with the pending user
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.manager@example.com",
    "password": "testpassword123"
  }'
```

Expected Response:

```json
{
	"success": true,
	"data": {
		"user": {
			"id": "user-...",
			"email": "test.manager@example.com",
			"role": "stage_manager",
			"status": "pending",
			"profile": {
				"firstName": "Test",
				"lastName": "Manager",
				"phone": "1234567890"
			}
		},
		"redirectUrl": "/stage-manager-pending"
	}
}
```

### 3. Browser Test

1. Go to `http://localhost:3000/register`
2. Fill in the form with:
    - First Name: Test
    - Last Name: Manager
    - Email: test.manager@example.com
    - Password: testpassword123
3. Submit the form
4. Should see success message
5. Go to `http://localhost:3000/login`
6. Login with the same credentials
7. Should redirect to `/stage-manager-pending`

## Debugging Steps

If login still fails:

1. **Check the data files:**

    ```bash
    # Check if user was saved to pending registrations
    # Look in your GCS bucket or local storage for:
    # registrations/stage-managers/pending.json
    ```

2. **Check server logs:**

    - Look for "New stage manager registered (pending): email"
    - Look for "User not found: email" during login

3. **Verify data access:**

    - The `getUserByEmail` function should now check pending registrations
    - The `updateUser` function should handle pending users

4. **Test the API directly:**
    - Use the curl commands above to test without the UI
    - Check the exact response messages

## Expected File Structure

After registration, you should have:

```
registrations/
  stage-managers/
    pending.json  # Contains the new user
```

After approval by admin:

```
users/
  stage_manager/
    users.json    # User moved here with status: "active"
```

## Common Issues

1. **"User not found" during login:**

    - Check if `getUserByEmail` is looking in pending registrations
    - Verify the user was actually saved during registration

2. **"User already exists" during registration:**

    - Check if there's already a user with that email
    - Clear test data if needed

3. **WebSocket not connecting:**
    - Make sure server.js is running (not just Next.js dev)
    - Check browser console for connection errors

## Success Indicators

✅ Registration creates user in pending status  
✅ Login works for pending users  
✅ Login redirects to `/stage-manager-pending`  
✅ Pending page shows correct status  
✅ WebSocket connects and authenticates  
✅ Admin can see pending user in dashboard  
✅ Approval process works with real-time updates
