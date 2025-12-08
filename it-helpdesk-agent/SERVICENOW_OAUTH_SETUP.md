# ServiceNow OAuth Integration Setup Guide

This guide explains how to set up OAuth 2.0 authentication for the ServiceNow integration in the IT Helpdesk Agent app.

## Prerequisites

1. ServiceNow instance (e.g., `https://dev308108.service-now.com`)
2. ServiceNow administrator access
3. MongoDB database configured

## Setup Steps

### 1. Configure OAuth Application in ServiceNow

1. Log into your ServiceNow instance as an administrator
2. Navigate to **System OAuth** > **Application Registry**
3. Click **New** and select **Create an OAuth API endpoint for external clients**
4. Fill in the following details:
   - **Name**: IT Helpdesk Agent
   - **Client ID**: (auto-generated or custom)
   - **Client Secret**: (auto-generated or custom)
   - **Redirect URL**: `http://localhost:3000/api/oauth/servicenow/callback`
     - For production: `https://your-domain.com/api/oauth/servicenow/callback`
   - **Token Lifespan**: 3600 (or as desired)
   - **Refresh Token Lifespan**: 86400 (or as desired)
5. Save the application and note down the **Client ID** and **Client Secret**

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# ServiceNow OAuth Configuration
SN_INSTANCE_URL="https://dev308108.service-now.com"
SN_CLIENT_ID="your-client-id-here"
SN_CLIENT_SECRET="your-client-secret-here"
SN_REDIRECT_URI="http://localhost:3000/api/oauth/servicenow/callback"
```

**Current Configuration (for reference):**

- Instance: `https://dev308108.service-now.com`
- Client ID: `cf33af14c32049f3a8c407d5ed24a230`
- Client Secret: `i3<@y~YZPHN~NZ;n|gV}!iijZd2g\`~^U`
- Redirect URI: `http://localhost:3000/api/oauth/servicenow/callback`

### 3. Restart the Application

After updating the environment variables, restart your Next.js development server:

```bash
npm run dev
```

### 4. Complete OAuth Flow

1. Navigate to the **Integrations** page in your app
2. Click on **ServiceNow** integration
3. Click the **Start OAuth Setup** button
4. You will be redirected to ServiceNow login page
5. Log in with your ServiceNow administrator credentials
6. Grant the requested permissions
7. You will be redirected back to the app with a success message

## Features Implemented

### API Routes

1. **`/api/oauth/servicenow/start`** (GET)

   - Generates ServiceNow OAuth authorization URL
   - Returns authorization URL with state parameter for CSRF protection

2. **`/api/oauth/servicenow/callback`** (GET)

   - Handles OAuth callback from ServiceNow
   - Exchanges authorization code for access and refresh tokens
   - Stores tokens securely in MongoDB
   - Redirects user back to integration page

3. **`/api/servicenow/test`** (POST)

   - Tests the ServiceNow connection
   - Automatically refreshes expired tokens
   - Makes a test API call to ServiceNow incident table

4. **`/api/servicenow/status`** (GET)

   - Returns current OAuth connection status
   - Shows connection details and metadata

5. **`/api/servicenow/disconnect`** (POST)
   - Disconnects OAuth integration
   - Clears tokens from database

### Database Model

The integration uses a MongoDB model (`IntegrationOAuth`) to store:

- Access token (encrypted)
- Refresh token (encrypted)
- Token expiry timestamp
- ServiceNow instance URL
- Connection status and timestamps
- Additional metadata

### Frontend Features

- **Start OAuth Setup** button triggers OAuth flow
- **Test Connection** button validates connection and refreshes tokens if needed
- **Disconnect** button clears OAuth tokens
- Real-time connection status display
- Error handling with user-friendly messages
- Automatic token refresh on expiry

## Token Management

### Token Refresh

The system automatically handles token refresh when:

- The access token has expired
- A ServiceNow API call returns 401 Unauthorized
- The test connection endpoint is called with an expired token

### Token Storage

Tokens are stored in MongoDB with the following schema:

```typescript
{
  provider: "servicenow",
  accessToken: string,
  refreshToken: string,
  tokenExpiry: Date,
  instanceUrl: string,
  connected: boolean,
  connectedAt: Date,
  lastTestAt: Date,
  metadata: object
}
```

## Security Considerations

1. **Environment Variables**: Never commit `.env.local` to version control
2. **HTTPS**: Use HTTPS in production for redirect URIs
3. **Token Storage**: Tokens are stored in MongoDB (consider encryption at rest)
4. **State Parameter**: CSRF protection using random state parameter
5. **Token Expiry**: Automatic token refresh reduces security exposure

## Troubleshooting

### "ServiceNow OAuth is not configured"

- Verify all environment variables are set correctly
- Restart the application after updating `.env.local`

### "Failed to exchange code for tokens"

- Check Client ID and Client Secret are correct
- Verify Redirect URI matches exactly in ServiceNow config
- Ensure ServiceNow instance URL is correct

### "Access token expired and no refresh token available"

- This means the refresh token is missing or invalid
- Disconnect and reconnect the integration

### Connection Status Not Updating

- Check MongoDB connection is working
- Verify database permissions
- Check browser console for JavaScript errors

## API Usage Examples

### Starting OAuth Flow

```typescript
const response = await fetch("/api/oauth/servicenow/start");
const data = await response.json();
window.location.href = data.authorizeUrl;
```

### Testing Connection

```typescript
const response = await fetch("/api/servicenow/test", {
  method: "POST",
});
const data = await response.json();
console.log(data.message);
```

### Checking Status

```typescript
const response = await fetch("/api/servicenow/status");
const data = await response.json();
console.log("Connected:", data.connected);
```

## Next Steps

After successful OAuth setup:

1. Test the connection using the **Test Connection** button
2. Configure field mappings for ticket synchronization
3. Set up webhooks for bi-directional sync (optional)
4. Enable automatic incident creation workflows

## Support

For issues or questions:

1. Check ServiceNow system logs
2. Review application logs in the terminal
3. Verify network connectivity to ServiceNow instance
4. Ensure MongoDB is accessible and running
