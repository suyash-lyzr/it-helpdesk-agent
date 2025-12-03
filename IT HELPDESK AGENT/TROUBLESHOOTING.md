# Troubleshooting Ticket Creation

## Issue: AI says ticket was created but it doesn't appear in dashboard

### Step 1: Check if the API call was actually made

1. **Check your terminal** where `npm run dev` is running
   - Look for logs starting with `=== TICKET CREATION REQUEST ===`
   - If you see these logs, the API is being called
   - If you don't see any logs, the API call never reached your server

2. **Check ngrok terminal** (if using ngrok)
   - Look for incoming HTTP requests to `/api/tickets`
   - Note any error responses

### Step 2: Verify ngrok is running and URL is correct

```bash
# Check if ngrok is running
curl https://nonrural-ariah-subclausal.ngrok-free.dev/api/tickets

# Should return JSON with tickets
```

**If ngrok URL changed:**
1. Get new ngrok URL: `ngrok http 3000`
2. Update `openapi-schema.json` server URL
3. Re-add the tool in Lyzr Studio with updated schema

### Step 3: Check Lyzr Studio Tool Configuration

1. **Verify tool is enabled:**
   - Go to Ticket Generator Agent → Tool Configuration
   - Ensure `createTicket` tool is listed and enabled

2. **Check tool instructions:**
   - Make sure the tool has clear instructions (see `TOOL_INSTRUCTIONS.md`)
   - The instruction should tell the agent to ALWAYS call this tool after generating ticket data

3. **Test the tool manually:**
   - In Lyzr Studio, try calling the tool directly in the test interface
   - Check if it returns a real ticket ID

### Step 4: Common Issues and Fixes

#### Issue: Tool returns fake/hallucinated ticket ID

**Cause:** The tool call failed but the AI didn't realize it, so it made up an ID.

**Fix:**
1. Check the tool instructions - make sure it says to use the ID returned by the tool
2. Add to Ticket Generator Agent instructions:
   ```
   IMPORTANT: After calling createTicket, you MUST use the exact ticket ID returned in the response. 
   Never invent or make up ticket IDs. If the tool call fails, tell the user there was an error.
   ```

#### Issue: CORS errors

**Symptoms:** Browser console shows CORS errors

**Fix:** Already handled in API routes, but verify:
- CORS headers are set correctly
- ngrok-skip-browser-warning header is allowed

#### Issue: ngrok browser warning blocking requests

**Symptoms:** Requests return HTML instead of JSON

**Fix:** 
- Add `ngrok-skip-browser-warning: true` header in Lyzr Studio tool configuration
- Or use ngrok's static domain (paid feature)

#### Issue: API returns 400/500 errors

**Check the logs:**
- Look at terminal output for error details
- Common issues:
  - Missing required fields (ticket_type, title, description)
  - Invalid enum values (priority, status, etc.)
  - Malformed JSON

### Step 5: Test the Full Flow

1. **Test API directly:**
   ```bash
   curl -X POST https://nonrural-ariah-subclausal.ngrok-free.dev/api/tickets \
     -H "Content-Type: application/json" \
     -H "ngrok-skip-browser-warning: true" \
     -d '{
       "ticket_type": "incident",
       "title": "Test from troubleshooting",
       "description": "Testing",
       "priority": "low"
     }'
   ```

2. **Check if ticket appears:**
   - Visit `http://localhost:3000/tickets`
   - Refresh the page
   - Check if the new ticket appears

3. **Test via Lyzr Studio:**
   - Use prompt: "My laptop battery is draining too fast, create a ticket"
   - Watch terminal for API logs
   - Check if ticket appears in dashboard

### Step 6: Debug Checklist

- [ ] ngrok is running and URL is correct
- [ ] OpenAPI schema has correct server URL
- [ ] Tool is enabled in Ticket Generator Agent
- [ ] Tool has proper instructions
- [ ] API logs show incoming requests
- [ ] No CORS errors in browser console
- [ ] Ticket Generator Agent instructions mention using real ticket IDs
- [ ] Local server is running (`npm run dev`)

### Step 7: Verify Ticket Generator Agent Instructions

Make sure your Ticket Generator Agent has this in its instructions:

```
After generating the ticket JSON, you MUST call the createTicket tool to save it.
The tool will return a ticket object with an "id" field.
You MUST use this exact ID in your response - never invent ticket IDs.
If the tool call fails, inform the user that ticket creation encountered an error.
```

## Quick Test Commands

```bash
# Test local API
curl http://localhost:3000/api/tickets

# Test ngrok API
curl https://nonrural-ariah-subclausal.ngrok-free.dev/api/tickets

# Create test ticket via ngrok
curl -X POST https://nonrural-ariah-subclausal.ngrok-free.dev/api/tickets \
  -H "Content-Type: application/json" \
  -H "ngrok-skip-browser-warning: true" \
  -d '{"ticket_type":"incident","title":"Test","description":"Test","priority":"low"}'

# Check latest tickets
curl http://localhost:3000/api/tickets | jq '.data | sort_by(.created_at) | reverse | .[0:3]'
```

## Still Not Working?

1. Check Lyzr Studio agent logs/traces for tool call errors
2. Verify the tool is actually being called (check traces in Lyzr Studio)
3. Try adding the tool again with fresh OpenAPI schema
4. Test with a simpler prompt to isolate the issue

