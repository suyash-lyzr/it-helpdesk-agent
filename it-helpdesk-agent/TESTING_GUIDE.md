# ServiceNow OAuth Integration - Testing Guide

## Quick Test Steps

### 1. Verify Environment Setup ✅

Your environment is already configured with:

- Instance URL: `https://dev308108.service-now.com`
- Client ID: `cf33af14c32049f3a8c407d5ed24a230`
- Redirect URI: `http://localhost:3000/api/oauth/servicenow/callback`
- Dev server is running on port 3000

### 2. Test OAuth Flow

#### Step 1: Navigate to ServiceNow Integration Page

```
http://localhost:3000/integrations/servicenow
```

#### Step 2: Start OAuth

1. Look for the **"Start OAuth Setup"** button in the top-right corner
2. Click the button
3. You should be redirected to ServiceNow login page

#### Step 3: Authenticate

1. Log in with your ServiceNow admin credentials
2. Review and accept the permission request
3. Click "Allow" or "Authorize"

#### Step 4: Verify Success

1. You'll be redirected back to the integration page
2. You should see a success toast: "ServiceNow OAuth completed successfully!"
3. The connection status badge should now show "Connected"
4. The **"Start OAuth Setup"** button should be replaced with **"Test Connection"**

### 3. Test Connection

#### After OAuth is Complete

1. Click the **"Test Connection"** button
2. You should see: "Successfully connected to ServiceNow"
3. This validates:
   - Access token is valid
   - ServiceNow API is accessible
   - Automatic token refresh works (if token expired)

### 4. Test Token Refresh

To test automatic token refresh:

1. Wait for token to expire (or manually expire it in database)
2. Click **"Test Connection"**
3. System should automatically:
   - Detect expired token
   - Use refresh token to get new access token
   - Save new tokens to database
   - Complete the test successfully

### 5. Test Disconnect

1. Click the **"Disconnect"** button (visible when connected)
2. Confirm the disconnection
3. Verify:
   - Status badge changes to "Not Connected"
   - Tokens are cleared from database
   - **"Start OAuth Setup"** button reappears

## Expected UI States

### State 1: Not Connected

```
Badge: "Not Connected" (gray)
Buttons:
  - "Start OAuth Setup" (enabled)
  - "Disconnect" (hidden)
  - "Test Connection" (hidden)
```

### State 2: Connected

```
Badge: "Connected" (green)
Buttons:
  - "Start OAuth Setup" (hidden)
  - "Disconnect" (enabled)
  - "Test Connection" (enabled)
```

### State 3: OAuth in Progress

```
Badge: "Not Connected" (gray)
Buttons: All disabled
Spinner: Visible
```

## API Endpoint Testing

### Test Start Endpoint

```bash
curl http://localhost:3000/api/oauth/servicenow/start
```

Expected response:

```json
{
  "success": true,
  "authorizeUrl": "https://dev308108.service-now.com/oauth_auth.do?response_type=code&client_id=...&redirect_uri=...&state=...",
  "state": "random-state-string"
}
```

### Test Status Endpoint

```bash
curl http://localhost:3000/api/servicenow/status
```

Expected response (when not connected):

```json
{
  "connected": false,
  "message": "ServiceNow is not connected."
}
```

Expected response (when connected):

```json
{
  "connected": true,
  "instanceUrl": "https://dev308108.service-now.com",
  "connectedAt": "2025-12-08T...",
  "lastTestAt": "2025-12-08T...",
  "metadata": {
    "scope": "...",
    "tokenType": "Bearer"
  }
}
```

### Test Connection Endpoint

```bash
curl -X POST http://localhost:3000/api/servicenow/test
```

Expected response (when connected):

```json
{
  "success": true,
  "message": "Successfully connected to ServiceNow",
  "data": {
    "incidentCount": 1
  }
}
```

## Troubleshooting

### Issue: "ServiceNow OAuth is not configured"

**Solution**:

- Verify `.env.local` has all 4 required variables
- Restart dev server: `npm run dev`
- Check terminal for "Reload env: .env.local"

### Issue: Redirect doesn't work

**Solution**:

- Verify redirect URI in `.env.local` matches ServiceNow config
- Check ServiceNow OAuth app has correct redirect URI
- Ensure no typos in URL

### Issue: "Failed to exchange code for tokens"

**Solution**:

- Verify Client Secret is correct
- Check ServiceNow OAuth app is active
- Review ServiceNow system logs for errors

### Issue: "Access token expired and no refresh token available"

**Solution**:

- Disconnect and reconnect the integration
- This gets fresh tokens with refresh token

### Issue: Connection status not updating

**Solution**:

- Check MongoDB is running and accessible
- Verify MONGODB_URI in `.env.local`
- Check browser console for errors
- Review terminal logs for database errors

## Database Verification

### Check if tokens are stored

```bash
# Connect to MongoDB and run:
db.integrationoauths.findOne({ provider: "servicenow" })
```

Expected document:

```json
{
  "_id": ObjectId("..."),
  "provider": "servicenow",
  "accessToken": "...",
  "refreshToken": "...",
  "tokenExpiry": ISODate("2025-12-08T..."),
  "instanceUrl": "https://dev308108.service-now.com",
  "connected": true,
  "connectedAt": ISODate("2025-12-08T..."),
  "metadata": {
    "scope": "...",
    "tokenType": "Bearer"
  },
  "createdAt": ISODate("2025-12-08T..."),
  "updatedAt": ISODate("2025-12-08T...")
}
```

## Success Criteria

✅ **OAuth Flow**

- User can click "Start OAuth Setup"
- Redirected to ServiceNow login
- Can authenticate successfully
- Redirected back with success message

✅ **Token Management**

- Access token stored in database
- Refresh token stored in database
- Token expiry calculated correctly
- Automatic refresh works

✅ **Connection Test**

- Test button validates connection
- ServiceNow API responds
- Shows success message

✅ **Disconnect**

- Disconnect button clears tokens
- Status updates to "Not Connected"
- Can reconnect successfully

✅ **Error Handling**

- Missing config shows helpful error
- Invalid credentials show error
- Network errors handled gracefully
- User sees friendly error messages

## Performance Metrics

- OAuth start: < 100ms
- Token exchange: < 2s
- Connection test: < 1s
- Status check: < 200ms
- Disconnect: < 500ms

## Security Checklist

✅ State parameter prevents CSRF
✅ Tokens stored server-side only
✅ HTTPS for production redirects
✅ Environment variables not committed
✅ Error messages don't expose secrets

## Next Actions

1. **Test Now**: Follow steps 1-5 above
2. **Report Issues**: Note any errors or unexpected behavior
3. **Production Deploy**: Update redirect URI for production
4. **Monitor**: Set up logging and monitoring
5. **Enhance**: Add webhook support, field mapping, etc.

---

**Ready to Test!** 🚀

Start by navigating to: http://localhost:3000/integrations/servicenow
